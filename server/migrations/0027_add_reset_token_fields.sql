ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expiry" timestamp;