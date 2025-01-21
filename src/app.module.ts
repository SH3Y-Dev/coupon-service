import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupons } from './entities/coupon.entity';
import { Product } from './entities/product.entity';
import { CouponProduct } from './entities/coupon-products.entity';
import { BxgyMapping } from './entities/bxgy-mappings.entity';
import { CouponModule } from './coupon/coupon.module';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodValidationFilter } from './common/filters/zod-validation.filter';

@Module({
  imports: [
    CouponModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Coupons, Product, CouponProduct, BxgyMapping],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Coupons, Product, CouponProduct, BxgyMapping]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: ZodValidationFilter,
    },
  ],
})
export class AppModule {}
