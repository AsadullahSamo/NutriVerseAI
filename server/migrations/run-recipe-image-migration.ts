import { drizzle } from 'drizzle-orm/node-postgres';
import postgres from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '../.env' });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const { Pool } = postgres;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Adding image_url column to cultural_recipes...');
    
    // Add image_url column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'cultural_recipes' 
          AND column_name = 'image_url'
        ) THEN
          ALTER TABLE "cultural_recipes"
          ADD COLUMN "image_url" text;

          RAISE NOTICE 'Added image_url column to cultural_recipes';
        ELSE
          RAISE NOTICE 'image_url column already exists in cultural_recipes';
        END IF;
      END $$;
    `);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();