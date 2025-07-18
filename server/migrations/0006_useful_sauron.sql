CREATE TABLE "cooking_skill_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"overall_level" integer DEFAULT 1 NOT NULL,
	"skill_areas" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_recipes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "meal_prep_plans" CASCADE;--> statement-breakpoint
ALTER TABLE "cooking_skill_levels" ADD CONSTRAINT "cooking_skill_levels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "likes";