import { sql } from "../server/db";

async function runSafeCookingSkillsMigration() {
  try {
    console.log('Starting cooking skills migration...');
    
    // First check if table exists to avoid errors
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'cooking_skill_levels'
      );
    `;

    if (!tableExists.rows[0].exists) {
      // Create table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS "cooking_skill_levels" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer NOT NULL,
          "overall_level" integer DEFAULT 1 NOT NULL,
          "skill_areas" jsonb DEFAULT '{}' NOT NULL,
          "completed_recipes" jsonb DEFAULT '[]' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;

      // Add foreign key with cascade delete
      await sql`
        ALTER TABLE "cooking_skill_levels"
        ADD CONSTRAINT "cooking_skill_levels_user_id_fkey"
        FOREIGN KEY ("user_id")
        REFERENCES "users"("id")
        ON DELETE CASCADE;
      `;

      console.log('Successfully created cooking_skill_levels table');
    } else {
      console.log('cooking_skill_levels table already exists, skipping creation');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runSafeCookingSkillsMigration().catch(console.error);