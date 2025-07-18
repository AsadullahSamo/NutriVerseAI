-- Rename score column to match_score
ALTER TABLE recipe_recommendations RENAME COLUMN score TO match_score;

-- Add missing columns
ALTER TABLE recipe_recommendations 
ADD COLUMN IF NOT EXISTS reason_for_recommendation TEXT,
ADD COLUMN IF NOT EXISTS seasonal_relevance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_shown TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS times_shown INTEGER DEFAULT 0;

-- Update the index on match_score
DROP INDEX IF EXISTS idx_recipe_recommendations_score;
CREATE INDEX IF NOT EXISTS idx_recipe_recommendations_match_score ON recipe_recommendations(match_score DESC); 