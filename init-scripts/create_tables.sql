CREATE TYPE "coupon_type" AS ENUM ('cart-wise', 'product-wise', 'bxgy');

CREATE TABLE "coupons" (
    "id" SERIAL PRIMARY KEY,
    "code" VARCHAR(50) UNIQUE NOT NULL,              
    "type" coupon_type NOT NULL,                     
    "discount_value" NUMERIC(10, 2) NOT NULL,       
    "min_cart_value" NUMERIC(10, 2),                
    "expiration_date" TIMESTAMP NOT NULL,           
    "created_at" TIMESTAMP DEFAULT NOW(),            
    "updated_at" TIMESTAMP DEFAULT NOW()            
);

CREATE TABLE "products" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,                    
    "price" NUMERIC(10, 2) NOT NULL,                 
    "created_at" TIMESTAMP DEFAULT NOW(),           
    "updated_at" TIMESTAMP DEFAULT NOW()            
);

CREATE TABLE "coupon_product" (
    "coupon_id" INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
    "product_id" INTEGER REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY ("coupon_id", "product_id")
);


CREATE TABLE "bxgy_mappings" (
    "id" SERIAL PRIMARY KEY,
    "coupon_id" INTEGER REFERENCES coupons(id) ON DELETE CASCADE,  
    "buy_product_ids" INTEGER[] NOT NULL,         
    "get_product_ids" INTEGER[] NOT NULL,          
    "buy_quantity" INTEGER NOT NULL,               
    "get_quantity" INTEGER NOT NULL,              
    "max_repetition" INTEGER DEFAULT 1,             
    "created_at" TIMESTAMP DEFAULT NOW(),          
    "updated_at" TIMESTAMP DEFAULT NOW()            
);

