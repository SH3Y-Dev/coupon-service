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

  @Column('jsonb', { name: 'buy_products' })
  buyProducts: {
    productId: number;
    quantity: number;
  }[];

  @Column('jsonb', { name: 'get_products' })
  getProducts: {
    productId: number;
    quantity: number;
  }[];

  @Column('int', { name: 'repetition_limit', default: 1 })
  repetitionLimit: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
