CREATE TABLE "kitchen_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"condition" text NOT NULL,
	"last_maintenance_date" text,
	"purchase_date" text,
	"maintenance_interval" integer,
	"maintenance_notes" text,
	"purchase_price" integer,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kitchen_storage_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"temperature" integer,
	"humidity" integer,
	"capacity" integer NOT NULL,
	"current_items" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"expiry_date" timestamp,
	"usage_frequency" integer DEFAULT 0 NOT NULL,
	"last_used" timestamp,
	"storage_conditions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "cooking_skill_levels" CASCADE;--> statement-breakpoint
ALTER TABLE "kitchen_equipment" ADD CONSTRAINT "kitchen_equipment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_storage_locations" ADD CONSTRAINT "kitchen_storage_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_items" ADD CONSTRAINT "storage_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_items" ADD CONSTRAINT "storage_items_location_id_kitchen_storage_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."kitchen_storage_locations"("id") ON DELETE no action ON UPDATE no action;