-- Add creator tracking and user-specific visibility
ALTER TABLE "cultural_cuisines"
  ADD COLUMN IF NOT EXISTS "created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "hidden_for" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "cultural_recipes"
  ADD COLUMN IF NOT EXISTS "created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "hidden_for" jsonb DEFAULT '[]'::jsonb;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_cultural_cuisines_created_by" ON "cultural_cuisines"("created_by");
CREATE INDEX IF NOT EXISTS "idx_cultural_recipes_created_by" ON "cultural_recipes"("created_by");