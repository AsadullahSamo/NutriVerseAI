import { sql } from '../db.js';

async function runMigration() {
  try {
    console.log('Starting migration: Make recipe_id nullable and add recipe_data column');
    
    // Make recipe_id column nullable
    await sql`
      ALTER TABLE recipe_recommendations 
      ALTER COLUMN recipe_id DROP NOT NULL;
    `;
    console.log('Made recipe_id column nullable');
    
    // Add recipe_data column
    await sql`
      ALTER TABLE recipe_recommendations 
      ADD COLUMN IF NOT EXISTS recipe_data JSONB;
    `;
    console.log('Added recipe_data column');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 