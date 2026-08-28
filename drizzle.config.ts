/**
 * Drizzle Configuration for Organizer
 * PostgreSQL 18 on Neon
 *
 * Migrations:
 * - Generated into: drizzle/migrations/
 * - Source schema: src/lib/db/schema.ts
 * - Database: neondb on Neon
 * - NOT APPLIED automatically (manual review first)
 */

import type { Config } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Set it before running drizzle-kit."
  );
}

export default {
  schema: ["./src/lib/db/schema.ts", "./src/lib/db/auth-schema.ts"],
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
  // Migrations only (no push to production)
  verbose: true,
  strict: true,
} satisfies Config;
