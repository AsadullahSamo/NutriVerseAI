import { db } from "../server/db";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCuisineImageMigration() {
  try {
    console.log('Starting cuisine image migration...');
    
    const migrationFile = resolve(__dirname, '0022_add_cuisine_image.sql');
    const migrationSql = readFileSync(migrationFile, 'utf-8');

    // Execute the migration
    await db.execute(migrationSql);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runCuisineImageMigration().catch(console.error);