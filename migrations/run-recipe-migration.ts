import postgres from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  const { Pool } = postgres;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Running recipe image URL migration...');
    
    await pool.query(`
      ALTER TABLE "cultural_recipes"
      ADD COLUMN IF NOT EXISTS "image_url" text;
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();