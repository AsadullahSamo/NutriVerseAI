CREATE TABLE IF NOT EXISTS "stores" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "location" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "price_history" (
  "id" serial PRIMARY KEY NOT NULL,
  "store_id" integer NOT NULL,
  "product_name" text NOT NULL,
  "price" decimal(10,2) NOT NULL,
  "unit" text NOT NULL,
  "recorded_at" timestamp DEFAULT now() NOT NULL,
  "on_sale" boolean DEFAULT false,
  "sale_end_date" timestamp,
  FOREIGN KEY ("store_id") REFERENCES "stores"("id")
);

CREATE TABLE IF NOT EXISTS "store_specific_lists" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "store_id" integer NOT NULL,
  "name" text NOT NULL,
  "items" jsonb NOT NULL,
  "total_estimated_cost" decimal(10,2),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp,
  FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  FOREIGN KEY ("store_id") REFERENCES "stores"("id")
);

CREATE TABLE IF NOT EXISTS "barcode_products" (
  "barcode" text PRIMARY KEY,
  "product_name" text NOT NULL,
  "brand" text,
  "category" text,
  "nutrition_info" jsonb,
  "sustainability_info" jsonb,
  "last_updated" timestamp DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_price_history_store ON price_history(store_id);
CREATE INDEX idx_price_history_product ON price_history(product_name);
CREATE INDEX idx_store_specific_lists_user ON store_specific_lists(user_id);
CREATE INDEX idx_store_specific_lists_store ON store_specific_lists(store_id);