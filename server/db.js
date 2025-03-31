import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables
config({ path: resolve(__dirname, '..', '.env') });
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set in .env file");
}
// Configure neon with retries and logging
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = undefined; // Disable WebSocket for serverless
// neonConfig.useSecure = true; // Ensure SSL is used
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
async function createDatabaseConnection() {
    let lastError;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            console.log(`Attempting database connection (attempt ${i + 1}/${MAX_RETRIES})...`);
            const sql = neon(process.env.DATABASE_URL);
            // Test the connection
            await sql `SELECT 1`;
            console.log('Database connection established successfully');
            // Create and return the connection and ORM instance
            const db = drizzle(sql, { schema });
            return { sql, db };
        }
        catch (error) {
            lastError = error;
            console.error(`Connection attempt ${i + 1} failed:`, error);
            if (i < MAX_RETRIES - 1) {
                console.log(`Retrying in ${RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }
    throw new Error(`Failed to connect to database after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
}
// Initialize database connection
const { sql, db } = await createDatabaseConnection();
// Export sql as pool for backward compatibility
const pool = sql;
export { db, sql, pool };
