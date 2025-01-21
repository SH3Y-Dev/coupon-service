import { Body, Controller, Post, BadRequestException, Get, Delete, NotFoundException, Param, Put } from '@nestjs/common';
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

  @Get('coupons/:id')
  async getCoupon(@Param('id') id: number) {
    const coupon = await this.couponService.getCouponById(id);
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }

  @Put('coupons/:id')
  async updateCoupon(@Param('id') id: number, @Body() body: CreateCouponDTO) {
    const updatedCoupon = await this.couponService.updateCoupon(id, body);
    if (!updatedCoupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return updatedCoupon;
  }

  @Delete('coupons/:id')
  async deleteCoupon(@Param('id') id: number) {
    const result = await this.couponService.deleteCoupon(id);
    if (!result) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return { message: 'Coupon successfully deleted' };
  }
}
