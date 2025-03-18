import { createConnection } from 'pg';
import { readFile } from 'fs/promises';
import { join } from 'path';

async function runMigration() {
  const client = createConnection();
  
  try {
    await client.connect();
    const sql = await readFile(join(__dirname, '0023_add_cultural_recipe_image_url.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();