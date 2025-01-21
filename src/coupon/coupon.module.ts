import { Module } from '@nestjs/common';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BxgyMapping } from 'src/entities/bxgy-mappings.entity';
import { CouponProduct } from 'src/entities/coupon-products.entity';
import { Coupons } from 'src/entities/coupon.entity';
import { Product } from 'src/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupons, Product, CouponProduct, BxgyMapping]),
  ],
  controllers: [CouponController],
  providers: [CouponService],
})
export class CouponModule {}
