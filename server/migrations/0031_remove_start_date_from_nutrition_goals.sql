-- Migration to remove the start_date column from the nutrition_goals table
ALTER TABLE nutrition_goals DROP COLUMN start_date;