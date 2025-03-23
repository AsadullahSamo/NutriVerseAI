import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function main() {
  console.log('Running secret key migration...');
  
  try {
    // Add secret key column
    await db.execute(sql`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "secret_key" TEXT;
    `);
    
    // Add unique constraint
    await db.execute(sql`
      ALTER TABLE users 
      ADD CONSTRAINT users_secret_key_unique 
      UNIQUE (secret_key);
    `);
    
    console.log('Migration successful!');
  } catch (error) {
    if (error.code === '42P07') {
      console.log('Constraint already exists, continuing...');
    } else {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

main().catch(console.error);