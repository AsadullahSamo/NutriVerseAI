-- Add createdBy column to cultural_cuisines table
ALTER TABLE "cultural_cuisines"
ADD COLUMN IF NOT EXISTS "created_by" integer REFERENCES "users"("id");

-- Add hiddenFor column to cultural_cuisines table if it doesn't exist
ALTER TABLE "cultural_cuisines"
ADD COLUMN IF NOT EXISTS "hidden_for" jsonb DEFAULT '[]';

