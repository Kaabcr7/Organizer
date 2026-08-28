/**
 * Drizzle Database Client Factory
 * Server-only database access
 *
 * Usage:
 *   const db = getDb();
 *   const user = await db.query.profiles.findFirst({...});
 *
 * Security:
 * - DATABASE_URL must be server-only environment variable
 * - Never expose connection string to client
 * - All queries must validate user ownership at API boundary
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL as string;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required. Set it in .env.local (server-side only)"
  );
}

// PostgreSQL client - singleton pattern
let client: postgres.Sql;
let db: ReturnType<typeof drizzle<typeof schema>>;

function getDb() {
  if (!db) {
    client = postgres(DATABASE_URL, {
      // Connection pooling settings
      max: 10, // Max connections in pool
      idle_timeout: 30, // Idle connection timeout (seconds)
      connect_timeout: 10, // Connection timeout (seconds)
    });

    db = drizzle(client, {
      schema,
      logger: process.env.NODE_ENV === "development",
    }) as unknown as ReturnType<typeof drizzle<typeof schema>>;
  }

  return db;
}

/**
 * Close database connection
 * Call this during app shutdown
 */
export async function closeDb() {
  if (client) {
    await client.end();
  }
}

export { getDb };
