ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "email" text,
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "avatar_url" text,
  ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- Update existing preferences to include new default fields
UPDATE "users"
SET "preferences" = jsonb_set(
  COALESCE("preferences", '{}'::jsonb),
  '{theme}',
  '"light"',
  true
)
WHERE NOT ("preferences" ? 'theme');

UPDATE "users"
SET "preferences" = jsonb_set(
  COALESCE("preferences", '{}'::jsonb),
  '{dietaryPreferences}',
  '[]',
  true
)
WHERE NOT ("preferences" ? 'dietaryPreferences');

UPDATE "users"
SET "preferences" = jsonb_set(
  COALESCE("preferences", '{}'::jsonb),
  '{region}',
  '""',
  true
)
WHERE NOT ("preferences" ? 'region');

UPDATE "users"
SET "preferences" = jsonb_set(
  COALESCE("preferences", '{}'::jsonb),
  '{units}',
  '"metric"',
  true
)
WHERE NOT ("preferences" ? 'units');

UPDATE "users"
SET "preferences" = jsonb_set(
  COALESCE("preferences", '{}'::jsonb),
  '{notifications}',
  'true',
  true
)
WHERE NOT ("preferences" ? 'notifications');

UPDATE "users"
SET "preferences" = jsonb_set(
  COALESCE("preferences", '{}'::jsonb),
  '{accentColor}',
  '"#0ea5e9"',
  true
)
WHERE NOT ("preferences" ? 'accentColor');