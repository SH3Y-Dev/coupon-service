import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Coupons } from '../entities/coupon.entity';
import { Product } from '../entities/product.entity';
import { BxgyMapping } from '../entities/bxgy-mappings.entity';
import { CouponProduct } from '../entities/coupon-products.entity';
import { CouponType } from 'src/common/enums/coupon.enum';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupons)
    private readonly couponsRepository: Repository<Coupons>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(BxgyMapping)
    private readonly bxgyMappingRepository: Repository<BxgyMapping>,
    @InjectRepository(CouponProduct)
    private readonly couponProductRepository: Repository<CouponProduct>,
  ) {}

  // 1. Create a new coupon
  async createCoupon(createCouponPayload: any): Promise<Coupons> {
    const {
      type,
      productIds,
      buyProducts,
      getProducts,
      buyQuantity,
      getQuantity,
    } = createCouponPayload;

    const coupon: any = this.couponsRepository.create({
      ...createCouponPayload,
    });
    await this.couponsRepository.save(coupon);

    // Handle product-wise coupon: associate products with the coupon
    if (type === 'product-wise' && productIds && productIds.length) {
      await this.addProductsToCoupon(coupon['id'], productIds);
    }

    // Handle bxgy coupon: add bxgy mappings
    if (type === 'bxgy' && buyProducts && getProducts) {
      await this.addBxgyMappings(
        coupon['id'],
        buyProducts,
        getProducts,
        createCouponPayload.repetition_limit,
        buyQuantity,
        getQuantity,
      );
    }

    return coupon;
  }

  // Associate products with a coupon (for product-wise coupon)
  async addProductsToCoupon(
    couponId: number,
    productIds: number[],
  ): Promise<void> {
    const products = await this.productRepository.findBy({
      id: In(productIds),
    });

    if (products.length != productIds.length) {
      throw new NotFoundException('Products not found');
    }

    const coupon = await this.couponsRepository.findOne({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const couponProducts = products.map((product) => {
      const couponProduct = new CouponProduct();
      couponProduct.coupons = coupon; // Automatically maps coupon relation
      couponProduct.product = product; // Automatically maps product relation
      return couponProduct;
    });

    await this.couponProductRepository.save(couponProducts);
  }

  // Add BxGy mappings
  async addBxgyMappings(
    couponId: number,
    buyProducts: any[],
    getProducts: any[],
    repetitionLimit: number,
    buyQuantity: number,
    getQuantity: number,
  ): Promise<void> {
    const bxgyMapping = this.bxgyMappingRepository.create({
      coupons: { id: couponId }, // Set the coupon using its id
      buyProductIds: buyProducts.map((bp) => bp.productId),
      getProductIds: getProducts.map((gp) => gp.productId),
      buyQuantity: buyQuantity, // You can update this logic based on the actual input
      getQuantity: getQuantity, // You can update this logic based on the actual input
      maxRepetition: repetitionLimit,
    });

    await this.bxgyMappingRepository.save(bxgyMapping);
  }

  // 2. Retrieve all coupons
  async getAllCoupons() {
    try {
      const currentDate = new Date(); // Get the current date
      const coupons = await this.couponsRepository.find({
        where: {
          expirationDate: MoreThanOrEqual(currentDate), // Filter coupons where expirationDate is greater than or equal to the current date
        },
      });
      return coupons;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  }

  // 3. Retrieve a specific coupon by ID
  async findOne(id: number): Promise<Coupons> {
    const coupon = await this.couponsRepository.findOne({
      where: { id },
      relations: ['products', 'bxgyMappings'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return coupon;
  }

  // Get applicable all coupons fir cart
  async getAllApplicableCoupons(cartItems: any) {
    console.log(JSON.stringify(cartItems.cart, null, 4));

    const totalCartValue = cartItems.cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0,
    );

    const applicableCoupons = [];

    // Fetch all valid coupons (cart-wise, product-wise, bxgy)
    const coupons = await this.getAllCoupons();
    console.log('coupons', coupons);

    for (const coupon of coupons) {
      // 1. Cart-wise Coupons
      if (
        coupon.type === CouponType.CART_WISE &&
        totalCartValue >= coupon.minCartValue
      ) {
        const discount = (coupon.discountValue / 100) * totalCartValue;
        applicableCoupons.push({
          couponId: coupon.id,
          type: coupon.type,
          discount,
        });
      }

      // 2. Product-wise Coupons
      if (coupon.type === CouponType.PRODUCT_WISE) {
        const couponProducts = await this.couponProductRepository.find({
          where: { coupons: { id: coupon.id } },
        });
        console.log('PW', couponProducts);

        let discount = 0;
        const applicableProductIds = []; // Array to hold applicable product IDs

        for (const couponProduct of couponProducts) {
          const cartItem = cartItems.cart.items.find(
            (item) => item.productId === couponProduct.product.id,
          );

          if (cartItem) {
            discount += coupon.discountValue * cartItem.quantity;
            applicableProductIds.push(cartItem.productId); // Add the product ID to the array
          }
        }

        if (discount > 0) {
          applicableCoupons.push({
            couponId: coupon.id,
            type: coupon.type,
            discount,
            applicableProductIds, // Add applicable product IDs to the response
          });
        }
      }

      // 3. BxGy Coupons
      if (coupon.type === CouponType.BXGY) {
        const bxgyMapping = await this.bxgyMappingRepository.findOne({
          where: { coupons: { id: coupon.id } },
        });

        let totalDiscount = 0;

        // Loop through the cart items to calculate BxGy discount
        for (const cartItem of cartItems.cart.items) {
          if (bxgyMapping.buyProductIds.includes(cartItem.productId)) {
            const productQuantity = cartItem.quantity;
            if (productQuantity >= bxgyMapping.buyQuantity) {
              const freeProducts =
                Math.floor(productQuantity / bxgyMapping.buyQuantity) *
                bxgyMapping.getQuantity;

              const productPrice = cartItem.price;
              totalDiscount += freeProducts * productPrice;
            }
          }
        }

        if (totalDiscount > 0) {
          applicableCoupons.push({
            couponId: coupon.id,
            type: coupon.type,
            discount: totalDiscount,
          });
        }
      }
    }

    return applicableCoupons;
  }

  // 4. Update a specific coupon
  //   async updateCoupon(id: number, updateCouponDto: any): Promise<Coupon> {
  //     const coupon = await this.couponRepository.findOneBy({ id });
  //     if (!coupon) {
  //       throw new NotFoundException(`Coupon with ID ${id} not found`);
  //     }

  //     Object.assign(coupon, updateCouponDto);
  //     await this.couponRepository.save(coupon);

  //     // Handle updated product-wise coupons or bxgy mappings if necessary
  //     if (updateCouponDto.product_ids) {
  //       await this.addProductsToCoupon(id, updateCouponDto.product_ids);
  //     }

  //     if (updateCouponDto.buy_products && updateCouponDto.get_products) {
  //       await this.addBxgyMappings(
  //         id,
  //         updateCouponDto.buy_products,
  //         updateCouponDto.get_products,
  //         updateCouponDto.repetition_limit,
  //       );
  //     }

  //     return coupon;
  //   }

  // 5. Delete a coupon
  //   async deleteCoupon(id: number): Promise<void> {
  //     const coupon = await this.couponRepository.findOneBy({ id });
  //     if (!coupon) {
  //       throw new NotFoundException(`Coupon with ID ${id} not found`);
  //     }

  //     await this.couponRepository.remove(coupon);
  //   }

  // 7. Apply a coupon to the cart
  async applyCouponToCart(couponId: number, cart: any): Promise<any> {
    // Apply the selected coupon to the cart and return updated cart with discounted prices
    // Handle different coupon types and their corresponding logic for applying discounts
  }
}
