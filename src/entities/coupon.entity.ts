import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CouponProduct } from './coupon-products.entity';
import { BxgyMapping } from './bxgy-mappings.entity';
import { CouponType } from 'src/common/enums/coupon.enum';

@Entity('coupons')
export class Coupons {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'discount_value' })
  discountValue: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'min_cart_value',
  })
  minCartValue: number;

  @Column({ type: 'timestamp', name: 'expiration_date' })
  expirationDate: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CouponProduct, (couponProduct) => couponProduct.coupons)
  couponProduct: CouponProduct[];

  @OneToMany(() => BxgyMapping, (bxgyMapping) => bxgyMapping.coupons)
  bxgyMapping: BxgyMapping[];
}
