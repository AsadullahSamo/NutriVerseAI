import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runNameMigration() {
  try {
    console.log('Starting name column migration...');
    
    await db.execute(sql`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "name" text;
    `);
    
    console.log('Name column migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runNameMigration().catch(console.error);