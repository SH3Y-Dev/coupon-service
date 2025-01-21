import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Coupons } from './coupon.entity';

@Entity('bxgy_mappings')
export class BxgyMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Coupons, { eager: true })
    @JoinColumn({ name: 'coupon_id', referencedColumnName: 'id' })
    coupons: Coupons;

  @Column('int', { array: true, name: 'buy_product_ids' })
  buyProductIds: number[];

  @Column('int', { array: true, name: 'get_product_ids' })
  getProductIds: number[];

  @Column('int', { name: 'buy_quantity' })
  buyQuantity: number;

  @Column('int', { name: 'get_quantity' })
  getQuantity: number;

  @Column('int', { name: 'max_repetition', default: 1 })
  maxRepetition: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
