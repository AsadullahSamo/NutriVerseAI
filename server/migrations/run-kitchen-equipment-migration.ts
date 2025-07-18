import { sql } from "drizzle-orm";
import { db } from "../server/db";

async function runMigration() {
  console.log('Running kitchen equipment migration...');
  
  try {
    // Run the migration SQL
    await db.execute(sql.raw(`
      -- Add new columns to kitchen_equipment table if they don't exist
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE "kitchen_equipment" ADD COLUMN "maintenance_notes" text;
        EXCEPTION
          WHEN duplicate_column THEN 
            RAISE NOTICE 'Column maintenance_notes already exists';
        END;
        
        BEGIN
          ALTER TABLE "kitchen_equipment" ADD COLUMN "purchase_price" integer;
        EXCEPTION
          WHEN duplicate_column THEN 
            RAISE NOTICE 'Column purchase_price already exists';
        END;
      END $$;
    `));

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

runMigration();