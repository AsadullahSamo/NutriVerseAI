CREATE TABLE IF NOT EXISTS "cooking_skill_levels" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "overall_level" integer DEFAULT 1 NOT NULL,
  "skill_areas" jsonb DEFAULT '{}' NOT NULL,
  "completed_recipes" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "cooking_skill_levels_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);