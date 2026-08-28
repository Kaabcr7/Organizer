/**
 * Better Auth Server Configuration
 * 
 * Self-hosted authentication using Better Auth with:
 * - Drizzle ORM adapter (PostgreSQL on Neon)
 * - Email/password authentication
 * - Session management via HTTP-only cookies
 * 
 * This is the central auth instance used by:
 * - API route handler (/api/auth/[...all])
 * - Server-side session validation (getAuthenticatedUser)
 * - Middleware (cookie-based session check)
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDb } from "@/lib/db";
import * as authSchema from "@/lib/db/auth-schema";
import { profiles } from "@/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL as string;

// Separate database connection for hooks to avoid connection pool contention
// with Better Auth's internal transaction.
let hookDb: ReturnType<typeof drizzle<typeof import("@/lib/db/schema")>>;

function getHookDb() {
  if (!hookDb) {
    const client = postgres(DATABASE_URL, {
      max: 3,
      idle_timeout: 30,
      connect_timeout: 10,
    });
    hookDb = drizzle(client, { schema: { profiles } }) as ReturnType<typeof drizzle<typeof import("@/lib/db/schema")>>;
  }
  return hookDb;
}

async function createProfileForUser(userId: string) {
  const db = getHookDb();
  await db
    .insert(profiles)
    .values({
      id: userId,
    })
    .onConflictDoNothing({ target: profiles.id });
}

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Fire-and-forget: don't await to avoid blocking the signup response.
          // The profile creation is idempotent (ON CONFLICT DO NOTHING) so
          // retries/races are safe.
          createProfileForUser(user.id).catch((err) => {
            console.error("Profile creation failed:", err);
          });
        },
      },
    },
  },
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
