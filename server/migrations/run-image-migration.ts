import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runImageMigration() {
  try {
    console.log('Starting image columns migration...');
    
    await db.execute(sql`
      ALTER TABLE "cultural_cuisines"
        ADD COLUMN IF NOT EXISTS "image_url" text,
        ADD COLUMN IF NOT EXISTS "banner_url" text,
        ADD COLUMN IF NOT EXISTS "color" text,
        ADD COLUMN IF NOT EXISTS "tags" jsonb[],
        ADD COLUMN IF NOT EXISTS "visual" jsonb DEFAULT '{"primaryColor": "#E2E8F0", "textColor": "#1A202C", "accentColor": "#4A5568"}'
    `);
    
    console.log('Image columns migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runImageMigration().catch(console.error);