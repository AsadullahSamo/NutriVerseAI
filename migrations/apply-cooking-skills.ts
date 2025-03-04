import { db } from "../server/db";

async function applyCookingSkillsMigration() {
  try {
    console.log('Starting cooking skills migration...');
    
    await db.execute(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT FROM pg_tables 
              WHERE schemaname = 'public' 
              AND tablename = 'cooking_skill_levels'
          ) THEN
              CREATE TABLE "cooking_skill_levels" (
                  "id" serial PRIMARY KEY NOT NULL,
                  "user_id" integer NOT NULL,
                  "overall_level" integer DEFAULT 1 NOT NULL,
                  "skill_areas" jsonb DEFAULT '{}'::jsonb NOT NULL,
                  "completed_recipes" jsonb DEFAULT '[]'::jsonb NOT NULL,
                  "created_at" timestamp DEFAULT now() NOT NULL,
                  "updated_at" timestamp DEFAULT now() NOT NULL,
                  CONSTRAINT "cooking_skill_levels_user_id_users_id_fk" 
                  FOREIGN KEY ("user_id") 
                  REFERENCES "users"("id") 
                  ON DELETE CASCADE
              );
              
              RAISE NOTICE 'Created cooking_skill_levels table';
          ELSE
              RAISE NOTICE 'cooking_skill_levels table already exists';
          END IF;
      END $$;
    `);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyCookingSkillsMigration();