import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log('Running cultural recipe image migration...');
  
  try {
    // Read and execute only the new migration
    const migration = readFileSync(join(__dirname, '0021_add_cultural_recipe_image.sql'), 'utf8');
    const upMigration = migration.split('-- Down Migration')[0].replace('-- Up Migration', '').trim();
    
    await sql(upMigration);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration().catch(console.error);