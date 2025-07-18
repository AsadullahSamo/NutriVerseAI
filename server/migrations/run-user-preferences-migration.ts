import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = fs.readFileSync(
  path.join(__dirname, '0035_create_user_preferences.sql'),
  'utf8'
);

const db = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mQHh1L7rSziT@ep-aged-pond-a4ze298b-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function runMigration() {
  try {
    console.log('Running user preferences migration...');
    
    // Split SQL into individual commands and execute each one
    const commands = sql.split(';').filter(cmd => cmd.trim());
    for (const command of commands) {
      if (command.trim()) {
        console.log('Executing command:', command.trim());
        await db(command.trim());
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 