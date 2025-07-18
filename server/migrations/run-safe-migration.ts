import { neon, neonConfig } from '@neondatabase/serverless';
import { config } from 'dotenv';
import ws from 'ws';

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function runSafeMigration() {
  try {
    console.log('Starting migration...');
    await sql`
      CREATE TABLE IF NOT EXISTS "meal_prep_plans" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "weekly_plan" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        CONSTRAINT "meal_prep_plans_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `;
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runSafeMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });