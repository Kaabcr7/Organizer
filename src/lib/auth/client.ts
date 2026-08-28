/**
 * Better Auth Client (React)
 * 
 * Provides reactive hooks for authentication in client components:
 * - useSession: Get current session state
 * - signIn: Email/password sign-in
 * - signUp: Email/password sign-up
 * - signOut: End session
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
