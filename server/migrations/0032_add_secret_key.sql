-- Add secret key column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS secret_key text UNIQUE;