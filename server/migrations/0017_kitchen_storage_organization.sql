CREATE TABLE IF NOT EXISTS "kitchen_storage_locations" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "type" varchar(50) NOT NULL CHECK (type IN ('pantry', 'refrigerator', 'freezer', 'cabinet', 'counter')),
    "temperature" integer,
    "humidity" integer,
    "capacity" integer NOT NULL,
    "current_items" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "storage_items" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "location_id" integer NOT NULL REFERENCES "kitchen_storage_locations"("id") ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "quantity" integer NOT NULL,
    "expiry_date" timestamp,
    "usage_frequency" integer NOT NULL DEFAULT 0,
    "last_used" timestamp,
    "storage_conditions" jsonb,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_storage_items_location" ON "storage_items"("location_id");
CREATE INDEX IF NOT EXISTS "idx_storage_items_expiry" ON "storage_items"("expiry_date");
CREATE INDEX IF NOT EXISTS "idx_storage_items_usage" ON "storage_items"("usage_frequency");