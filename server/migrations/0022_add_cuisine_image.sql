-- Add imageUrl column to cultural_cuisines table
ALTER TABLE "cultural_cuisines" ADD COLUMN "image_url" text;

-- Down migration if needed
-- ALTER TABLE "cultural_cuisines" DROP COLUMN "image_url";