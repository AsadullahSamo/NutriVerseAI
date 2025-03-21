import { db } from '../db';
import { sql } from 'drizzle-orm';

async function applyClerkMigration() {
  try {
    console.log('Applying Clerk authentication migration...');
    
    // Drop existing authentication columns
    await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS password`);
    await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS email`);
    await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS username`);
    await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS reset_token`);
    await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS reset_token_expires`);

    // Add Clerk ID column
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE`);
    
    console.log('Clerk authentication migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyClerkMigration();