-- Drop the likes column from community_posts table
ALTER TABLE community_posts DROP COLUMN IF EXISTS likes;