import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from "dotenv";
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory path for proper .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv with specific path to the .env file
dotenv.config({ path: resolve(__dirname, '..', '..', '.env') });

// Check for DATABASE_URL, use fallback if not found
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not found in environment variables, using fallback value");
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_mQHh1L7rSziT@ep-aged-pond-a4ze298b-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
}

async function runMigration(migrationFileName) {
  // Create a new pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('Attempting database connection...');
    const client = await pool.connect();
    console.log('Database connection established successfully');

    // Read the migration file
    const migrationPath = resolve(__dirname, migrationFileName);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Running migration: ${migrationFileName}...`);
    
    // Execute each statement separately
    for (const statement of statements) {
      if (statement) {
        await client.query(statement);
      }
    }

    console.log('Migration completed successfully');
    await client.release();
    await pool.end();
  } catch (error) {
    console.error(`Error running migration ${migrationFileName}:`, error);
    process.exit(1);
  }
}

// Get the migration filename from command line arguments
const migrationFileName = process.argv[2] || '0034_recipe_recommendations.sql';
runMigration(migrationFileName);