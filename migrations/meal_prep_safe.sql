-- Create meal_prep_plans table if it doesn't exist (without affecting session table)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meal_prep_plans') THEN
        CREATE TABLE "meal_prep_plans" (
            "id" serial PRIMARY KEY NOT NULL,
            "user_id" integer NOT NULL,
            "weekly_plan" jsonb NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "is_active" boolean DEFAULT true NOT NULL
        );

        -- Add foreign key if it doesn't exist
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'meal_prep_plans_user_id_users_id_fk'
        ) THEN
            ALTER TABLE "meal_prep_plans"
            ADD CONSTRAINT "meal_prep_plans_user_id_users_id_fk"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
    END IF;
END $$;