import { db } from "../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log("Running recipe recommendations migration...");
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, "0034_recipe_recommendations.sql");
    const sql = fs.readFileSync(sqlFilePath, "utf8");
    
    // Execute the SQL
    await db.execute(sql);
    
    console.log("Recipe recommendations migration completed successfully!");
  } catch (error) {
    console.error("Error running recipe recommendations migration:", error);
    process.exit(1);
  }
}

runMigration(); 