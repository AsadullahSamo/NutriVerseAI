-- Drop existing tables if they exist (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS "recipe_consumption" CASCADE;
DROP TABLE IF EXISTS "recipe_likes" CASCADE;
DROP TABLE IF EXISTS "meal_prep_plans" CASCADE;
DROP TABLE IF EXISTS "meal_plans" CASCADE;
DROP TABLE IF EXISTS "nutrition_goals" CASCADE;
DROP TABLE IF EXISTS "pantry_items" CASCADE;
DROP TABLE IF EXISTS "grocery_lists" CASCADE;
DROP TABLE IF EXISTS "community_posts" CASCADE;
DROP TABLE IF EXISTS "recipes" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Create tables in correct order (dependencies first)
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "preferences" jsonb DEFAULT '{}' NOT NULL,
  "dna_profile" jsonb,
  "mood_journal" jsonb[]
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" integer,
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "recipes" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "ingredients" jsonb NOT NULL,
  "instructions" jsonb NOT NULL,
  "nutrition_info" jsonb NOT NULL,
  "image_url" text,
  "prep_time" integer NOT NULL,
  "created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "likes" integer DEFAULT 0 NOT NULL,
  "forked_from" integer REFERENCES "recipes"("id") ON DELETE SET NULL,
  "sustainability_score" integer,
  "wastage_reduction" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "recipe_likes" (
  "recipe_id" integer NOT NULL REFERENCES "recipes"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  PRIMARY KEY ("recipe_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "community_posts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "recipe_id" integer REFERENCES "recipes"("id") ON DELETE SET NULL,
  "content" text NOT NULL,
  "type" text NOT NULL,
  "location" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "grocery_lists" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "items" jsonb NOT NULL,
  "completed" boolean DEFAULT false NOT NULL,
  "expiry_dates" jsonb,
  "smart_substitutions" jsonb
);

CREATE TABLE IF NOT EXISTS "pantry_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "quantity" text NOT NULL,
  "expiry_date" timestamp,
  "category" text,
  "nutrition_info" jsonb NOT NULL,
  "sustainability_info" jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS "nutrition_goals" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "daily_calories" integer NOT NULL,
  "daily_protein" integer NOT NULL,
  "daily_carbs" integer NOT NULL,
  "daily_fat" integer NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "progress" jsonb DEFAULT '[]' NOT NULL
);

CREATE TABLE IF NOT EXISTS "meal_plans" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "preferences" jsonb NOT NULL,
  "meals" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "meal_prep_plans" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "weekly_plan" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  CONSTRAINT "meal_prep_plans_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "recipe_consumption" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "recipe_id" integer NOT NULL REFERENCES "recipes"("id") ON DELETE CASCADE,
  "consumed_at" timestamp DEFAULT now() NOT NULL,
  "servings" integer DEFAULT 1 NOT NULL,
  "meal_type" text NOT NULL
);

-- First, create a backup of session data
CREATE TABLE IF NOT EXISTS "session_backup" AS SELECT * FROM "session";

-- Update foreign key constraints without dropping tables
ALTER TABLE IF EXISTS "nutrition_goals" DROP CONSTRAINT IF EXISTS "nutrition_goals_user_id_fkey";
ALTER TABLE IF EXISTS "meal_plans" DROP CONSTRAINT IF EXISTS "meal_plans_user_id_fkey";
ALTER TABLE IF EXISTS "recipe_consumption" DROP CONSTRAINT IF EXISTS "recipe_consumption_user_id_fkey";
ALTER TABLE IF EXISTS "recipe_consumption" DROP CONSTRAINT IF EXISTS "recipe_consumption_recipe_id_fkey";
ALTER TABLE IF EXISTS "meal_prep_plans" DROP CONSTRAINT IF EXISTS "meal_prep_plans_user_id_fkey";

-- Add back foreign key constraints with CASCADE
ALTER TABLE "nutrition_goals" 
  ADD CONSTRAINT "nutrition_goals_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "meal_plans" 
  ADD CONSTRAINT "meal_plans_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "recipe_consumption" 
  ADD CONSTRAINT "recipe_consumption_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "recipe_consumption" 
  ADD CONSTRAINT "recipe_consumption_recipe_id_fkey" 
  FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;

ALTER TABLE "meal_prep_plans" 
  ADD CONSTRAINT "meal_prep_plans_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;