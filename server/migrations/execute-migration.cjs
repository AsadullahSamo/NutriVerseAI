const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  const client = new Client();
  
  try {
    await client.connect();
    const sql = await fs.readFile(path.join(__dirname, '0023_add_cultural_recipe_image_url.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();