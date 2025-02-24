CREATE TABLE "meal_plans" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "title" text NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "preferences" jsonb NOT NULL,
  "meals" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
);