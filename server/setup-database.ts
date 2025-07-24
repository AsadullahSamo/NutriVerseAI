import 'dotenv/config';
import { sql } from '@vercel/postgres';
import { createPool } from '@vercel/postgres';

async function setupDatabase(connectionString?: string) {
  try {
    console.log('Starting database setup...');
    
    // Create a custom pool if connection string is provided
    const pool = connectionString 
      ? createPool({ connectionString }) 
      : undefined;
    
    // Use the custom pool or the default sql client
    const db = pool ? { query: (query: string, values?: any[]) => pool.query(query, values) } : sql;

    // Drop existing tables if they exist (in correct order due to foreign key constraints)
    await db.query(`
      DROP TABLE IF EXISTS "recipe_consumption" CASCADE;
      DROP TABLE IF EXISTS "recipe_likes" CASCADE;
      DROP TABLE IF EXISTS "meal_prep_plans" CASCADE;
      DROP TABLE IF EXISTS "meal_plans" CASCADE;
      DROP TABLE IF EXISTS "nutrition_goals" CASCADE;
      DROP TABLE IF EXISTS "pantry_items" CASCADE;
      DROP TABLE IF EXISTS "grocery_lists" CASCADE;
      DROP TABLE IF EXISTS "community_posts" CASCADE;
      DROP TABLE IF EXISTS "recipe_recommendations" CASCADE;
      DROP TABLE IF EXISTS "recommendation_feedback" CASCADE;
      DROP TABLE IF EXISTS "recommendation_triggers" CASCADE;
      DROP TABLE IF EXISTS "seasonal_ingredients" CASCADE;
      DROP TABLE IF EXISTS "user_preferences" CASCADE;
      DROP TABLE IF EXISTS "recipes" CASCADE;
      DROP TABLE IF EXISTS "session" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
      DROP TABLE IF EXISTS "cultural_cuisines" CASCADE;
      DROP TABLE IF EXISTS "cultural_recipes" CASCADE;
      DROP TABLE IF EXISTS "cultural_techniques" CASCADE;
      DROP TABLE IF EXISTS "kitchen_equipment" CASCADE;
      DROP TABLE IF EXISTS "post_likes" CASCADE;
    `);

    // Create tables in correct order (dependencies first)
    await db.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" text NOT NULL UNIQUE,
        "password" text NOT NULL,
        "email" text UNIQUE,
        "name" text,
        "bio" text,
        "profile_picture" text,
        "reset_token" text,
        "reset_token_expiry" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "secret_key" text UNIQUE,
        "preferences" jsonb DEFAULT '{}' NOT NULL,
        "dna_profile" jsonb,
        "mood_journal" jsonb[]
      );

      CREATE TABLE IF NOT EXISTS "session" (
        "sid" character varying PRIMARY KEY,
        "sess" json,
        "expire" timestamp without time zone
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
        "created_at" timestamp DEFAULT now() NOT NULL,
        "hidden_for" jsonb DEFAULT '[]' NOT NULL,
        "username" text NOT NULL
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
        "sustainability_info" jsonb NOT NULL,
        "image_url" text
      );

      CREATE TABLE IF NOT EXISTS "nutrition_goals" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "daily_calories" integer NOT NULL,
        "daily_protein" integer NOT NULL,
        "daily_carbs" integer NOT NULL,
        "daily_fat" integer NOT NULL,
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
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "weekly_plan" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "recipe_consumption" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "recipe_id" integer NOT NULL REFERENCES "recipes"("id") ON DELETE CASCADE,
        "consumed_at" timestamp DEFAULT now() NOT NULL,
        "servings" integer DEFAULT 1 NOT NULL,
        "meal_type" text NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "recipe_recommendations" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "recipe_id" integer REFERENCES "recipes"("id") ON DELETE CASCADE,
        "match_score" float NOT NULL,
        "user_data_snapshot" jsonb NOT NULL,
        "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "reason_for_recommendation" text,
        "seasonal_relevance" boolean DEFAULT false,
        "last_shown" timestamp with time zone,
        "times_shown" integer DEFAULT 0,
        "expires_at" timestamp with time zone,
        "is_active" boolean DEFAULT true NOT NULL,
        "recommendation_group" text,
        "priority" integer DEFAULT 0,
        "recipe_data" jsonb,
        UNIQUE("user_id", "recipe_id")
      );

      CREATE INDEX IF NOT EXISTS "idx_recipe_recommendations_user_id" ON "recipe_recommendations"("user_id");
      CREATE INDEX IF NOT EXISTS "idx_recipe_recommendations_recipe_id" ON "recipe_recommendations"("recipe_id");
      CREATE INDEX IF NOT EXISTS "idx_recipe_recommendations_score" ON "recipe_recommendations"("match_score" DESC);

      CREATE TABLE IF NOT EXISTS "recommendation_feedback" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "recommendation_id" integer NOT NULL REFERENCES "recipe_recommendations"("id"),
        "rating" integer NOT NULL,
        "feedback" text,
        "was_cooked" boolean DEFAULT false,
        "was_saved" boolean DEFAULT false,
        "was_shared" boolean DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "cooking_notes" text,
        "modifications" jsonb,
        "difficulty_rating" integer,
        "time_accuracy" integer,
        "taste_rating" integer,
        "healthiness_rating" integer
      );

      CREATE TABLE IF NOT EXISTS "recommendation_triggers" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "trigger_type" text NOT NULL,
        "trigger_data" jsonb NOT NULL,
        "affected_recommendations" jsonb NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "processed_at" timestamp,
        "status" text NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "seasonal_ingredients" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "season" text NOT NULL,
        "peak_months" jsonb NOT NULL,
        "nutritional_benefits" jsonb NOT NULL,
        "sustainability_info" jsonb NOT NULL,
        "storage_tips" text,
        "substitution_options" jsonb,
        "image_url" text,
        "created_at" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "user_preferences" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "preference" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "cultural_cuisines" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "region" text NOT NULL,
        "description" text NOT NULL,
        "key_ingredients" jsonb NOT NULL,
        "cooking_techniques" jsonb NOT NULL,
        "cultural_context" jsonb NOT NULL,
        "serving_etiquette" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "image_url" text,
        "banner_url" text,
        "color" text,
        "tags" jsonb,
        "visual" jsonb DEFAULT '{"primaryColor": "#E2E8F0", "textColor": "#1A202C", "accentColor": "#4A5568"}',
        "created_by" integer REFERENCES "users"("id"),
        "hidden_for" jsonb DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS "cultural_recipes" (
        "id" serial PRIMARY KEY NOT NULL,
        "cuisine_id" integer NOT NULL REFERENCES "cultural_cuisines"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "local_name" text,
        "description" text NOT NULL,
        "difficulty" text NOT NULL,
        "authentic_ingredients" jsonb NOT NULL,
        "local_substitutes" jsonb,
        "instructions" jsonb NOT NULL,
        "cultural_notes" jsonb NOT NULL,
        "serving_suggestions" jsonb NOT NULL,
        "complementary_dishes" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "image_url" text,
        "created_by" integer REFERENCES "users"("id"),
        "hidden_for" jsonb DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS "cultural_techniques" (
        "id" serial PRIMARY KEY NOT NULL,
        "cuisine_id" integer NOT NULL REFERENCES "cultural_cuisines"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "description" text NOT NULL,
        "difficulty" text NOT NULL,
        "steps" jsonb NOT NULL,
        "tips" jsonb NOT NULL,
        "common_uses" jsonb NOT NULL,
        "video_url" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "kitchen_equipment" (
        "id" integer PRIMARY KEY,
        "user_id" integer,
        "name" text,
        "category" text,
        "condition" text,
        "last_maintenance_date" timestamp without time zone,
        "purchase_date" timestamp without time zone,
        "maintenance_interval" integer,
        "created_at" timestamp without time zone,
        "updated_at" timestamp without time zone,
        "maintenance_notes" text,
        "purchase_price" integer
      );

      CREATE TABLE IF NOT EXISTS "post_likes" (
        "post_id" integer,
        "user_id" integer
      );
    `);

    console.log('Database setup completed successfully!');
    
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

// Get connection string from command line argument or environment variable
const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: No database connection string provided.');
  console.error('Please provide a connection string as a command line argument or set the DATABASE_URL environment variable.');
  console.error('Usage: npx tsx server/setup-database.ts "postgresql://username:password@host:port/database"');
  process.exit(1);
}

// Run the setup
setupDatabase(connectionString).catch(console.error); 