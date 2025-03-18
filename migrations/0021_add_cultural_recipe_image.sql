-- Up Migration
ALTER TABLE cultural_cuisine 
ADD COLUMN image_url TEXT;

-- Down Migration
ALTER TABLE cultural_cuisine 
DROP COLUMN image_url;