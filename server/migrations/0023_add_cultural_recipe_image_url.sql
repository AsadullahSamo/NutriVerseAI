-- Add image_url column to cultural_recipes table
ALTER TABLE "cultural_recipes"
  ADD COLUMN IF NOT EXISTS "image_url" text;