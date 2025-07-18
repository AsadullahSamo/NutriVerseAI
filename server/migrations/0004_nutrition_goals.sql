CREATE TABLE "nutrition_goals" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "daily_calories" integer NOT NULL,
  "daily_protein" integer NOT NULL,
  "daily_carbs" integer NOT NULL,
  "daily_fat" integer NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "progress" jsonb DEFAULT '[]'::jsonb NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
);