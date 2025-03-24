import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runContentVisibilityMigration() {
  try {
    console.log('Starting content visibility migration...');
    
    // Add created_by to cultural_cuisines
    await db.execute(sql`
      ALTER TABLE "cultural_cuisines" 
      ADD COLUMN IF NOT EXISTS "created_by" integer REFERENCES "users"("id")
    `);

    // Add hidden_for to cultural_cuisines
    await db.execute(sql`
      ALTER TABLE "cultural_cuisines" 
      ADD COLUMN IF NOT EXISTS "hidden_for" jsonb DEFAULT '[]'::jsonb
    `);

    // Add created_by to cultural_recipes
    await db.execute(sql`
      ALTER TABLE "cultural_recipes" 
      ADD COLUMN IF NOT EXISTS "created_by" integer REFERENCES "users"("id")
    `);

    // Add hidden_for to cultural_recipes
    await db.execute(sql`
      ALTER TABLE "cultural_recipes" 
      ADD COLUMN IF NOT EXISTS "hidden_for" jsonb DEFAULT '[]'::jsonb
    `);

    // Create index for cultural_cuisines
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_cuisine_hidden_for 
      ON cultural_cuisines USING gin (hidden_for)
    `);

    // Create index for cultural_recipes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_recipe_hidden_for 
      ON cultural_recipes USING gin (hidden_for)
    `);

    console.log('Content visibility migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runContentVisibilityMigration().catch(console.error);