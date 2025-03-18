import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('Running cultural recipe image URL migration...');
  
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const migrationSQL = readFileSync(resolve(__dirname, '0023_add_cultural_recipe_image_url.sql'), 'utf8');
    await pool.query(migrationSQL);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});