import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the root directory
config({ path: resolve(__dirname, '..', '.env') });

console.log('Environment variables loaded:', {
  DATABASE_URL: process.env.DATABASE_URL ? '[PRESENT]' : '[MISSING]',
  SESSION_SECRET: process.env.SESSION_SECRET ? '[PRESENT]' : '[MISSING]',
  BACKEND_PORT: process.env.BACKEND_PORT
});

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Initialize session table if it doesn't exist
async function initializeSessionTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" jsonb NOT NULL,
        "expire" timestamptz NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

      CREATE TABLE IF NOT EXISTS "meal_plans" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "title" text NOT NULL,
        "start_date" timestamp NOT NULL,
        "end_date" timestamp NOT NULL,
        "preferences" jsonb NOT NULL,
        "meals" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
      );
    `);
    console.log('Session and meal_plans tables initialized successfully');
  } catch (err) {
    console.error('Failed to initialize tables:', err);
    throw err;
  }
}

// Test the connection and initialize session table
pool.connect()
  .then(async () => {
    console.log('Database connection successful');
    await initializeSessionTable();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

export { db, pool, sql };