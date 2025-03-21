-- Add email column to users table
ALTER TABLE IF EXISTS "users" ADD COLUMN "email" text;
-- Add unique constraint to email
ALTER TABLE IF EXISTS "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");