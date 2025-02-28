import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Configure neon to use fetch compatibility
neonConfig.fetchConnectionCache = true;

// Create the Neon SQL client
const sql = neon(process.env.DATABASE_URL);

// Create the Drizzle ORM instance
const db = drizzle(sql, { schema });

// Export sql as pool for backward compatibility
const pool = sql;

export { db, sql, pool };