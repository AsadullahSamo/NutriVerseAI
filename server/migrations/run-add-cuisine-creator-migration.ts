import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nutricart';
const migrationClient = postgres(connectionString);
const db = drizzle(migrationClient);

// Run migration
async function main() {
  console.log('Running migration to add cuisine creator...');
  
  try {
    // Add createdBy column
    await db.execute(sql`
      ALTER TABLE "cultural_cuisines"
      ADD COLUMN IF NOT EXISTS "created_by" integer REFERENCES "users"("id");
    `);
    console.log('Added createdBy column');

    // Add hiddenFor column
    await db.execute(sql`
      ALTER TABLE "cultural_cuisines"
      ADD COLUMN IF NOT EXISTS "hidden_for" jsonb DEFAULT '[]';
    `);
    console.log('Added hiddenFor column');
    
    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await migrationClient.end();
  }
}

main().catch(console.error);