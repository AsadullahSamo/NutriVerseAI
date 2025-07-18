-- Data-preserving migration for post_likes

-- First, create the post_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS "post_likes" (
  "post_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  CONSTRAINT "post_likes_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);

-- Add foreign key constraints if they don't exist
ALTER TABLE IF EXISTS "post_likes" 
  ADD CONSTRAINT IF NOT EXISTS "post_likes_post_id_community_posts_id_fk" 
  FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE;

ALTER TABLE IF EXISTS "post_likes" 
  ADD CONSTRAINT IF NOT EXISTS "post_likes_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create a function to help with data migration
CREATE OR REPLACE FUNCTION migrate_recipe_likes() RETURNS void AS $$
DECLARE
  post_rec RECORD;
  like_rec RECORD;
BEGIN
  -- For each recipe_like record, find corresponding community post and migrate the like
  FOR like_rec IN SELECT * FROM recipe_likes LOOP
    -- Find community post that references this recipe
    FOR post_rec IN SELECT * FROM community_posts WHERE recipe_id = like_rec.recipe_id LOOP
      -- Insert into post_likes only if it doesn't exist yet
      INSERT INTO post_likes (post_id, user_id)
      VALUES (post_rec.id, like_rec.user_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_recipe_likes();

-- Drop the function after use
DROP FUNCTION migrate_recipe_likes();

-- 3. Keep the session table

-- 4. Don't remove the likes column from recipes yet, we'll do that in a separate migration
-- after ensuring the data is properly migrated

-- 3. DON'T drop the session table, just rebuild constraints if needed
-- ALTER TABLE "nutrition_goals" DROP CONSTRAINT IF EXISTS "nutrition_goals_user_id_fkey";
-- ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_users_id_fk" 
--     FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 4. Check if migration for meal_plans and recipe_consumption constraints is needed
-- Only apply if constraints are incorrect
DO $$ 
BEGIN
    -- Don't drop constraints that might exist, just add them if they don't
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meal_plans_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recipe_consumption_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "recipe_consumption" ADD CONSTRAINT "recipe_consumption_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recipe_consumption_recipe_id_recipes_id_fk'
    ) THEN
        ALTER TABLE "recipe_consumption" ADD CONSTRAINT "recipe_consumption_recipe_id_recipes_id_fk" 
            FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- 5. DONT drop the likes column yet - first, create a function to safely migrate recipe likes data
-- We'll need to implement this part based on how recipe likes are stored
-- This is a placeholder for a function that would create post_likes entries for recipe likes

-- For now, leave the recipes.likes column in place until data is migrated
-- ALTER TABLE "recipes" DROP COLUMN IF EXISTS "likes";

-- Disable row level security on tables that aren't using it
ALTER TABLE "session" DISABLE ROW LEVEL SECURITY;

-- After confirming data migration, you can run the 0006 and 0007 migrations to remove the likes columns