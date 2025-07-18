-- Add new columns to kitchen_equipment table
ALTER TABLE IF EXISTS "kitchen_equipment"
ADD COLUMN IF NOT EXISTS "maintenance_notes" text,
ADD COLUMN IF NOT EXISTS "purchase_price" integer;