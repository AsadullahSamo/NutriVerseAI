-- Cultural Cuisines Tables
CREATE TABLE IF NOT EXISTS "cultural_cuisines" (
    "id" serial PRIMARY KEY,
    "name" varchar(255) NOT NULL,
    "region" varchar(255) NOT NULL,
    "description" text NOT NULL,
    "key_ingredients" jsonb NOT NULL,
    "cooking_techniques" jsonb NOT NULL,
    "cultural_context" jsonb NOT NULL,
    "serving_etiquette" jsonb NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "cultural_recipes" (
    "id" serial PRIMARY KEY,
    "cuisine_id" integer NOT NULL REFERENCES "cultural_cuisines"("id") ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "local_name" varchar(255),
    "description" text NOT NULL,
    "difficulty" varchar(50) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    "authentic_ingredients" jsonb NOT NULL,
    "local_substitutes" jsonb,
    "instructions" jsonb NOT NULL,
    "cultural_notes" jsonb NOT NULL,
    "serving_suggestions" jsonb NOT NULL,
    "complementary_dishes" jsonb,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "cultural_techniques" (
    "id" serial PRIMARY KEY,
    "cuisine_id" integer NOT NULL REFERENCES "cultural_cuisines"("id") ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "description" text NOT NULL,
    "difficulty" varchar(50) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    "steps" jsonb NOT NULL,
    "tips" jsonb NOT NULL,
    "common_uses" jsonb NOT NULL,
    "video_url" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_cultural_recipes_cuisine" ON "cultural_recipes"("cuisine_id");
CREATE INDEX IF NOT EXISTS "idx_cultural_recipes_difficulty" ON "cultural_recipes"("difficulty");
CREATE INDEX IF NOT EXISTS "idx_cultural_techniques_cuisine" ON "cultural_techniques"("cuisine_id");
CREATE INDEX IF NOT EXISTS "idx_cultural_techniques_difficulty" ON "cultural_techniques"("difficulty");