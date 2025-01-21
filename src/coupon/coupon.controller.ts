import { Body, Controller, Post, BadRequestException, Get } from '@nestjs/common';
import { z } from 'zod';
import { CouponService } from './coupon.service';
import { CreateCouponDTO } from '../common/dto/create-coupon.dto';

@Controller('')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('coupons')
  async createCoupon(@Body() body: CreateCouponDTO) {
    return this.couponService.createCoupon(body);
  }

  @Get('coupons')
  async getCoupons(){
    return this.couponService.getAllCoupons();
  }

  @Post('applicable-coupons')
  async applicableCoupons(@Body() body: any) {
    return this.couponService.getAllApplicableCoupons(body);
  }
}
