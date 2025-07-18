CREATE TABLE "cultural_cuisines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"description" text NOT NULL,
	"key_ingredients" jsonb NOT NULL,
	"cooking_techniques" jsonb NOT NULL,
	"cultural_context" jsonb NOT NULL,
	"serving_etiquette" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cultural_recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"cuisine_id" integer NOT NULL,
	"name" text NOT NULL,
	"local_name" text,
	"description" text NOT NULL,
	"difficulty" text NOT NULL,
	"authentic_ingredients" jsonb NOT NULL,
	"local_substitutes" jsonb,
	"instructions" jsonb NOT NULL,
	"cultural_notes" jsonb NOT NULL,
	"serving_suggestions" jsonb NOT NULL,
	"complementary_dishes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cultural_techniques" (
	"id" serial PRIMARY KEY NOT NULL,
	"cuisine_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" text NOT NULL,
	"steps" jsonb NOT NULL,
	"tips" jsonb NOT NULL,
	"common_uses" jsonb NOT NULL,
	"video_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"temperature" real,
	"humidity" real,
	"capacity" integer NOT NULL,
	"current_items" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "storage_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1,
	"unit" varchar(50),
	"category" varchar(100),
	"expiry_date" date,
	"usage_frequency" varchar(50),
	"storage_requirements" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "cooking_skill_levels" CASCADE;--> statement-breakpoint
ALTER TABLE "cultural_recipes" ADD CONSTRAINT "cultural_recipes_cuisine_id_cultural_cuisines_id_fk" FOREIGN KEY ("cuisine_id") REFERENCES "public"."cultural_cuisines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_techniques" ADD CONSTRAINT "cultural_techniques_cuisine_id_cultural_cuisines_id_fk" FOREIGN KEY ("cuisine_id") REFERENCES "public"."cultural_cuisines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_equipment" ADD CONSTRAINT "kitchen_equipment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_storage_locations" ADD CONSTRAINT "kitchen_storage_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_items" ADD CONSTRAINT "storage_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_items" ADD CONSTRAINT "storage_items_location_id_kitchen_storage_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."kitchen_storage_locations"("id") ON DELETE cascade ON UPDATE no action;