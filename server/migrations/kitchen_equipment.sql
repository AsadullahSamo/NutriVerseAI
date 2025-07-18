-- Create kitchen_equipment table if it doesn't exist
CREATE TABLE IF NOT EXISTS "kitchen_equipment" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "name" varchar(100) NOT NULL,
  "category" varchar(50) NOT NULL,
  "condition" varchar(20) NOT NULL,
  "last_maintenance_date" timestamp,
  "purchase_date" timestamp,
  "maintenance_interval" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "kitchen_equipment_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);