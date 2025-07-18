-- Create user preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  preference TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add some default preferences for existing users
INSERT INTO user_preferences (user_id, preference)
SELECT id, 'vegetarian' FROM users WHERE NOT EXISTS (
  SELECT 1 FROM user_preferences WHERE user_id = users.id
); 