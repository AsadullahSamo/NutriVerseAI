import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting migration to add hidden_for column...");
    
    // Add hidden_for column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'community_posts' 
          AND column_name = 'hidden_for'
        ) THEN
          ALTER TABLE community_posts ADD COLUMN hidden_for JSONB DEFAULT '[]' NOT NULL;
        END IF;
      END $$;
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main(); 