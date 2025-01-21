import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CouponTypeEnum = z.enum(['cart-wise', 'product-wise', 'bxgy']);

const BuyProductSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
});

const GetProductSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
});

export const CreateCouponSchema = z.object({
  code: z.string(),
  type: CouponTypeEnum,
  discountValue: z.number().optional(),
  minCartValue: z.number().optional(),
  expirationDate: z.string(),
  productIds: z.array(z.number().int().positive()).optional(),
  buyProducts: z.array(BuyProductSchema).optional(),
  getProducts: z.array(GetProductSchema).optional(),
  repetitionLimit: z.number().int().min(1).optional(),
  buyQuantity: z.number().optional(),
  getQuantity: z.number().optional(),
});
export class CreateCouponDTO extends createZodDto(CreateCouponSchema) {}
