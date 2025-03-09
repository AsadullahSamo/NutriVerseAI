const { sql } = require("../server/db");
const { readFileSync } = require('fs');
const { resolve } = require('path');

async function runStorageMigration() {
  try {
    console.log('Starting kitchen storage migration...');
    const migrationSQL = readFileSync(
      resolve(__dirname, '0017_kitchen_storage_organization.sql'),
      'utf8'
    );
    
    await sql.query(migrationSQL);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runStorageMigration().catch(console.error);