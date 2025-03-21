-- Drop old authentication columns
ALTER TABLE users
DROP COLUMN IF EXISTS password,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS username,
DROP COLUMN IF EXISTS reset_token,
DROP COLUMN IF EXISTS reset_token_expires;

-- Add Clerk ID column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;