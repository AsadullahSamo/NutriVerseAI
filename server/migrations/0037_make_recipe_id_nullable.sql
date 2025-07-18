-- Make recipe_id column nullable in recipe_recommendations table
ALTER TABLE recipe_recommendations ALTER COLUMN recipe_id DROP NOT NULL;

-- Add recipe_data column to store the complete recipe data
ALTER TABLE recipe_recommendations ADD COLUMN IF NOT EXISTS recipe_data JSONB;

-- Update the schema.js file to reflect these changes
-- Note: This is just a comment, the actual schema.js update will be done separately 