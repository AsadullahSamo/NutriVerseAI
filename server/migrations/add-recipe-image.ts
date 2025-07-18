import postgres from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const { Pool } = postgres;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nutricart'
  });

  try {
    console.log('Running recipe image URL migration...');
    
    const sql = await readFile(join(__dirname, '0023_add_cultural_recipe_image_url.sql'), 'utf8');
    await pool.query(sql);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();