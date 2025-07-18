-- Add missing columns
ALTER TABLE recipe_recommendations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS recommendation_group TEXT,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Update existing rows to have default values for new columns
UPDATE recipe_recommendations 
SET expires_at = NOW() + INTERVAL '7 days',
    is_active = true,
    recommendation_group = 'initial',
    priority = 0
WHERE expires_at IS NULL;

-- Make the columns NOT NULL after setting default values
ALTER TABLE recipe_recommendations 
ALTER COLUMN expires_at SET NOT NULL,
ALTER COLUMN recommendation_group SET NOT NULL; 