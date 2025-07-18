// External dependencies first
import { drizzle } from "drizzle-orm/neon-http"
import { neon, neonConfig } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get directory path for proper .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv with specific path to the .env file
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// Check for DATABASE_URL, use fallback if not found
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not found in environment variables, using fallback value");
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_sxwyXg7jqMp9@ep-curly-recipe-adkzy3zd-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
}

// Log connection info for debugging
console.log("Database connection string available:", !!process.env.DATABASE_URL);
console.log("Database URL prefix:", process.env.DATABASE_URL.substring(0, 30) + "...");

// Local imports after
import * as schema from "./shared/schema.js"

// Configure neon with retry settings
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = undefined; // Disable WebSocket for serverless

// Define retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function createDatabaseConnection() {
  let lastError;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`Attempting database connection (attempt ${i + 1}/${MAX_RETRIES})...`);
      const sql = neon(process.env.DATABASE_URL);
      
      // Test the connection
      await sql`SELECT 1`;
      console.log('Database connection established successfully');
      
      // Create and return the connection and ORM instance
      const db = drizzle(sql, { schema });
      return { sql, db };
    } catch (error) {
      lastError = error;
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i < MAX_RETRIES - 1) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw new Error(`Failed to connect to database after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
}

// Initialize database connection with fallback
let connection;
let sql;
let db;
let pool;

try {
  connection = await createDatabaseConnection();
  sql = connection.sql;
  db = connection.db;
  pool = sql; // For backward compatibility
  console.log('✅ Database connection established successfully');
} catch (error) {
  console.warn('⚠️ Database connection failed, using fallback configuration:', error.message);

  // Create a mock connection for development/testing
  sql = {
    query: () => Promise.resolve([]),
    end: () => Promise.resolve()
  };

  db = {
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => Promise.resolve({ insertId: 1 }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    delete: () => ({ where: () => Promise.resolve() })
  };

  pool = sql;
}

export { sql, db, pool };

// Simple query to verify the database connection
export async function checkDbConnection() {
  try {
    await sql`SELECT NOW()`
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection error:', error)
    return false
  }
}

// Set up a cleanup function to end the pool when the application shuts down
function cleanup() {
  console.log('Closing database pool...')
  sql.end()
}

// Listen for termination signals
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
// Also handle the nodemon restart signal
process.once('SIGUSR2', cleanup)