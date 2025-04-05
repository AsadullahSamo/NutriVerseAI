-- Remove extra columns from users table while preserving existing data
ALTER TABLE "users" 
DROP COLUMN IF EXISTS "preferences",
DROP COLUMN IF EXISTS "dna_profile",
DROP COLUMN IF EXISTS "mood_journal",
DROP COLUMN IF EXISTS "avatar";