import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Coupons } from './coupon.entity';
import { Product } from './product.entity';

@Entity('coupon_product')
export class CouponProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Coupons, { eager: true })
  @JoinColumn({ name: 'coupon_id', referencedColumnName: 'id' })
  coupons: Coupons;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;
}
