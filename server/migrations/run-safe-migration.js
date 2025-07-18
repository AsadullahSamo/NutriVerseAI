import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('Running safe kitchen equipment migration...');
  
  try {
    // Use the same database configuration as your application
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'root',
      database: 'nutricart',
      password: 'password'
    });

    const db = drizzle(pool);
    
    // Read and execute the migration SQL
    const migrationSQL = await fs.readFile(
      join(__dirname, '0014_kitchen_equipment_safe.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);
    console.log('Migration completed successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();