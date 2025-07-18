-- Drop the likes column from recipes table since likes are now only on community posts
ALTER TABLE recipes DROP COLUMN IF EXISTS likes;

-- Drop the recipe_likes table since it's no longer needed
DROP TABLE IF EXISTS recipe_likes;