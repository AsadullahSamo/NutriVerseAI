CREATE TABLE IF NOT EXISTS "kitchen_storage_locations" (
    "id" serial PRIMARY KEY,
    "name" varchar(255) NOT NULL,
    "type" varchar(50) NOT NULL,
    "temperature" integer,
    "humidity" integer,
    "capacity" integer NOT NULL,
    "current_items" integer DEFAULT 0,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "storage_items" (
    "id" serial PRIMARY KEY,
    "location_id" integer REFERENCES "kitchen_storage_locations"("id") ON DELETE CASCADE,
    "item_name" varchar(255) NOT NULL,
    "quantity" integer NOT NULL,
    "expiry_date" timestamp,
    "usage_frequency" integer DEFAULT 0,
    "last_used" timestamp,
    "storage_conditions" jsonb,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_storage_items_location" ON "storage_items"("location_id");
CREATE INDEX IF NOT EXISTS "idx_storage_items_expiry" ON "storage_items"("expiry_date");
CREATE INDEX IF NOT EXISTS "idx_storage_items_usage" ON "storage_items"("usage_frequency");