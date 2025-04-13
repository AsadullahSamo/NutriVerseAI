-- Create nutrition goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS nutrition_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  daily_calories INTEGER,
  protein_grams INTEGER,
  carbs_grams INTEGER,
  fat_grams INTEGER,
  fiber_grams INTEGER,
  sugar_grams INTEGER,
  sodium_mg INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add default nutrition goals for existing users
INSERT INTO nutrition_goals (
  user_id, 
  daily_calories, 
  protein_grams, 
  carbs_grams, 
  fat_grams, 
  fiber_grams, 
  sugar_grams, 
  sodium_mg
)
SELECT 
  id,
  2000,  -- Default daily calories
  50,    -- Default protein grams
  250,   -- Default carbs grams
  70,    -- Default fat grams
  25,    -- Default fiber grams
  50,    -- Default sugar grams
  2300   -- Default sodium mg (FDA recommended)
FROM users 
WHERE NOT EXISTS (
  SELECT 1 FROM nutrition_goals WHERE user_id = users.id
); 