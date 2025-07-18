CREATE TABLE "kitchen_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"condition" text NOT NULL,
	"last_maintenance_date" timestamp,
	"purchase_date" timestamp,
	"maintenance_interval" integer,
	"maintenance_notes" text,
	"purchase_price" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "cooking_skill_levels" CASCADE;--> statement-breakpoint
ALTER TABLE "kitchen_equipment" ADD CONSTRAINT "kitchen_equipment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;