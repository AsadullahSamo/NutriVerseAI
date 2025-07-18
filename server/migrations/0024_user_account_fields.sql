-- Add new user account fields
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "email" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "profile_picture" TEXT,
ADD COLUMN IF NOT EXISTS "reset_token" TEXT,
ADD COLUMN IF NOT EXISTS "reset_token_expiry" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL;

-- Add timestamps to existing rows that don't have them
UPDATE "users" SET "created_at" = NOW() WHERE "created_at" IS NULL;
UPDATE "users" SET "updated_at" = NOW() WHERE "updated_at" IS NULL;