-- Create recipe recommendations table
CREATE TABLE IF NOT EXISTS recipe_recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  score FLOAT NOT NULL,
  user_data_snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, recipe_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_recipe_recommendations_user_id ON recipe_recommendations(user_id);

-- Create index on recipe_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_recipe_recommendations_recipe_id ON recipe_recommendations(recipe_id);

-- Create index on score for faster sorting
CREATE INDEX IF NOT EXISTS idx_recipe_recommendations_score ON recipe_recommendations(score DESC);

-- Create recommendation feedback table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  recommendation_id INTEGER NOT NULL REFERENCES recipe_recommendations(id),
  rating INTEGER NOT NULL,
  feedback TEXT,
  was_cooked BOOLEAN DEFAULT false,
  was_saved BOOLEAN DEFAULT false,
  was_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  cooking_notes TEXT,
  modifications JSONB,
  difficulty_rating INTEGER,
  time_accuracy INTEGER,
  taste_rating INTEGER,
  healthiness_rating INTEGER
);

-- Create recommendation triggers table
CREATE TABLE IF NOT EXISTS recommendation_triggers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  trigger_type TEXT NOT NULL,
  trigger_data JSONB NOT NULL,
  affected_recommendations JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  status TEXT NOT NULL
);

-- Create seasonal ingredients table
CREATE TABLE IF NOT EXISTS seasonal_ingredients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  peak_months JSONB NOT NULL,
  nutritional_benefits JSONB NOT NULL,
  sustainability_info JSONB NOT NULL,
  storage_tips TEXT,
  substitution_options JSONB,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  preference TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
); 