CREATE TABLE kitchen_equipment (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  condition VARCHAR(20) NOT NULL,
  last_maintenance_date TIMESTAMP,
  purchase_date TIMESTAMP,
  maintenance_interval INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);