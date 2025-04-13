import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from "dotenv";
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

async function checkSchema() {
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

    // Query to get table information
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'recipe_recommendations'
      ORDER BY ordinal_position;
    `);

    console.log('Recipe Recommendations Table Schema:');
    console.log('-----------------------------------');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });

    // Check if match_score column exists
    const matchScoreExists = result.rows.some(row => row.column_name === 'match_score');
    console.log('\nMatch Score Column Exists:', matchScoreExists);

    // Check if score column exists
    const scoreExists = result.rows.some(row => row.column_name === 'score');
    console.log('Score Column Exists:', scoreExists);

    await client.release();
    await pool.end();
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema(); 