import { sql } from "../server/db";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runStorageMigration() {
  try {
    console.log('Starting kitchen storage migration...');
    
    // First check if tables exist
    const { rows } = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE tablename = 'kitchen_storage_locations'
      ) as has_locations;
    `;

    const hasLocations = rows?.[0]?.has_locations;

    if (!hasLocations) {
      // Create kitchen_storage_locations table
      await sql`
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
        )
      `;

      // Create storage_items table
      await sql`
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
        )
      `;

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS "idx_storage_items_location" ON "storage_items"("location_id")`;
      await sql`CREATE INDEX IF NOT EXISTS "idx_storage_items_expiry" ON "storage_items"("expiry_date")`;
      await sql`CREATE INDEX IF NOT EXISTS "idx_storage_items_usage" ON "storage_items"("usage_frequency")`;
      
      console.log('Migration completed successfully');
    } else {
      console.log('Tables already exist, skipping migration');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runStorageMigration().catch(console.error);