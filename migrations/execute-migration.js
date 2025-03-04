import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon } from "@neondatabase/serverless";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

async function executeMigration() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // First create the table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS "kitchen_equipment" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL,
        "name" text NOT NULL,
        "category" text NOT NULL,
        "condition" text NOT NULL,
        "last_maintenance_date" timestamp,
        "purchase_date" timestamp,
        "maintenance_interval" integer,
        "created_at" timestamp DEFAULT NOW() NOT NULL,
        "updated_at" timestamp DEFAULT NOW() NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `;

    // Then add the new columns
    await sql`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE "kitchen_equipment" 
          ADD COLUMN IF NOT EXISTS "maintenance_notes" text,
          ADD COLUMN IF NOT EXISTS "purchase_price" integer;
        EXCEPTION 
          WHEN duplicate_column THEN 
            RAISE NOTICE 'Column already exists';
        END;
      END $$;
    `;
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

executeMigration();