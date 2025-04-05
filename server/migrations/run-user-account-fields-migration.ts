import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { join } from 'path';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nutricart';
const migrationClient = postgres(connectionString);
const db = drizzle(migrationClient);

// Run migration
async function main() {
  console.log('Running migration for user account fields...');
  
  try {
    await db.execute(SQL`
      -- Add new user account fields
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "email" TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS "name" TEXT,
      ADD COLUMN IF NOT EXISTS "bio" TEXT,
      ADD COLUMN IF NOT EXISTS "profile_picture" TEXT,
      ADD COLUMN IF NOT EXISTS "reset_token" TEXT,
      ADD COLUMN IF NOT EXISTS "reset_token_expiry" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL;
      
      -- Add timestamps to existing rows that don't have them
      UPDATE "users" SET "created_at" = NOW() WHERE "created_at" IS NULL;
      UPDATE "users" SET "updated_at" = NOW() WHERE "updated_at" IS NULL;
    `);
    
    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await migrationClient.end();
  }
}

main();