ALTER TABLE cultural_cuisines ADD COLUMN hidden_for JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cultural_recipes ADD COLUMN hidden_for JSONB DEFAULT '[]'::jsonb;

-- Add indexes for performance
CREATE INDEX idx_cuisine_hidden_for ON cultural_cuisines USING gin (hidden_for);
CREATE INDEX idx_recipe_hidden_for ON cultural_recipes USING gin (hidden_for);