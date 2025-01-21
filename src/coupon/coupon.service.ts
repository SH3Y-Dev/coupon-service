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
      repetitionLimit, // Use repetitionLimit instead of buyQuantity/getQuantity
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
        repetitionLimit, // Use repetitionLimit directly here
      );
    }

    return coupon;
  }

  //  product-wise coupon
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
    buyProducts: { productId: number; quantity: number }[],
    getProducts: { productId: number; quantity: number }[],
    repetitionLimit: number,
  ): Promise<void> {
    const bxgyMapping = this.bxgyMappingRepository.create({
      coupons: { id: couponId },
      buyProducts: buyProducts, // Ensure buyProducts array is passed correctly
      getProducts: getProducts, // Ensure getProducts array is passed correctly
      repetitionLimit: repetitionLimit, // Store the repetition limit as it is
    });

    await this.bxgyMappingRepository.save(bxgyMapping);
  }

  // Retrieve all coupons
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

  // Retrieve a specific coupon by ID
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
    const totalCartValue = cartItems.cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0,
    );
    const applicableCoupons = [];

    // Fetch all valid coupons (cart-wise, product-wise, bxgy)
    const coupons = await this.getAllCoupons();

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

        let discount = 0;
        const applicableProductIds = [];

        for (const couponProduct of couponProducts) {

          const cartItem = cartItems.cart.items.find(
            (item) => item.productId === couponProduct.product.id,
          );

          if (cartItem) {
            discount += coupon.discountValue * cartItem.quantity;
            applicableProductIds.push(cartItem.productId);
          }
        }

        if (discount > 0) {
          applicableCoupons.push({
            couponId: coupon.id,
            type: coupon.type,
            discount,
            applicableProductIds,
          });
        }
      }

      // 3. BxGy Coupons
      if (coupon.type === CouponType.BXGY) {
        const bxgyMapping = await this.bxgyMappingRepository.findOne({
          where: { coupons: { id: coupon.id } },
        });

        let totalDiscount = 0;
        const repetitionCount = bxgyMapping.repetitionLimit;

        // Calculate how many total 'buy' products are available in the cart across both product a and product b
        const totalBuyProductCount = bxgyMapping.buyProducts.reduce(
          (totalCount, buyProduct) => {
            const cartItem = cartItems.cart.items.find(
              (item) => item.productId === buyProduct.productId,
            );
            if (cartItem) {
              return (
                totalCount + Math.floor(cartItem.quantity / buyProduct.quantity)
              );
            }
            return totalCount;
          },
          0,
        );

        // Calculate how many free products we can get based on the buy products
        const totalFreeProducts =
          totalBuyProductCount *
          bxgyMapping.getProducts.reduce((totalFree, getProduct) => {
            const cartItem = cartItems.cart.items.find(
              (item) => item.productId === getProduct.productId,
            );
            if (cartItem) {
              const freeQuantity = Math.min(
                totalBuyProductCount * getProduct.quantity,
                cartItem.quantity,
              );
              return totalFree + freeQuantity;
            }
            return totalFree;
          }, 0);

        // Limit the free prodcts to the repetition count
        const limitedFreeProducts = Math.min(
          repetitionCount,
          totalFreeProducts,
        );

        // calculating the total discount based on the limited free products
        for (const getProduct of bxgyMapping.getProducts) {
          const cartItem = cartItems.cart.items.find(
            (item) => item.productId === getProduct.productId,
          );
          if (cartItem) {
            totalDiscount += limitedFreeProducts * cartItem.price;
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

  // Get a specific coupon by its ID
  async getCouponById(id: number): Promise<Coupons | null> {
    return await this.couponsRepository.findOne({ where: { id } });
  }

  // Update a specific coupon by its ID
  async updateCoupon(id: number, updatePayload: any): Promise<Coupons | null> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Update coupon details
    Object.assign(coupon, updatePayload);
    await this.couponsRepository.save(coupon);

    // Handle product-wise coupon
    if (
      updatePayload.type === 'product-wise' &&
      updatePayload.productIds &&
      updatePayload.productIds.length
    ) {
      // Step 1: Remove old product associations from coupon_product table // can be improved {dangerous to delete can use transactrions}
      await this.couponProductRepository.delete({
        coupons: { id: coupon.id },
      });

      // Step 2: Add new products to the coupon
      await this.addProductToCoupon(coupon.id, updatePayload.productIds);
    }

    // add or update bxgy mappings
    if (
      updatePayload.type === 'bxgy' &&
      updatePayload.buyProducts &&
      updatePayload.getProducts
    ) {
      await this.addBxgyMappings(
        coupon.id,
        updatePayload.buyProducts,
        updatePayload.getProducts,
        updatePayload.repetitionLimit,
      );
    }

    return coupon;
  }

  // Delete a specific coupon by its ID
  async deleteCoupon(id: number): Promise<boolean> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponsRepository.remove(coupon);
    return true;
  }

  async addProductToCoupon(
    couponId: number,
    productIds: number[],
  ): Promise<void> {
    const products = await this.productRepository.findBy({
      id: In(productIds),
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('Some products not found');
    }

    const coupon = await this.couponsRepository.findOne({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const couponProducts = products.map((product) => {
      const couponProduct = new CouponProduct();
      couponProduct.coupons = coupon;
      couponProduct.product = product;
      return couponProduct;
    });

    await this.couponProductRepository.save(couponProducts);
  }
}
