-- Create meal_prep_plans table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_prep_plans') THEN
        CREATE TABLE "meal_prep_plans" (
            "id" serial PRIMARY KEY NOT NULL,
            "user_id" integer NOT NULL,
            "weekly_plan" jsonb NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "is_active" boolean DEFAULT true NOT NULL,
            CONSTRAINT "meal_prep_plans_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        );
    END IF;
END $$;