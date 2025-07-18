DO $$ 
BEGIN 
  BEGIN
    ALTER TABLE "kitchen_equipment" 
    ADD COLUMN IF NOT EXISTS "maintenance_notes" text,
    ADD COLUMN IF NOT EXISTS "purchase_price" integer;
  EXCEPTION 
    WHEN duplicate_column THEN 
      RAISE NOTICE 'Column already exists';
  END;
END $$;