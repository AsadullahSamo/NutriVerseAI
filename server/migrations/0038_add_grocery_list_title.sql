ALTER TABLE "grocery_lists"
  ADD COLUMN IF NOT EXISTS "title" text DEFAULT 'Shopping List' NOT NULL;
