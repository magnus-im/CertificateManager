
import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function reset() {
    console.log("Resetting database...");

    try {
        // Drop all tables in public schema
        console.log("Dropping tables...");
        await db.execute(sql`DROP SCHEMA public CASCADE;`);
        await db.execute(sql`CREATE SCHEMA public;`);
        await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`);
        // Need to grant to current user? Usually owner has access.
        // appuser is owner of database, so it should be fine.

        console.log("Database cleared.");
    } catch (error) {
        console.error("Error clearing database:", error);
        process.exit(1);
    }
}

// Ensure we exit
reset().then(() => {
    console.log("Reset complete. Please run migrations and seed.");
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
