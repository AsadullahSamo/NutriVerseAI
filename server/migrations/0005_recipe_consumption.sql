CREATE TABLE "recipe_consumption" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "recipe_id" integer NOT NULL,
  "consumed_at" timestamp DEFAULT now() NOT NULL,
  "servings" integer DEFAULT 1 NOT NULL,
  "meal_type" text NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id")
);