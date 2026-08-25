/**
 * Browser Supabase client (safe for use in React components and browser APIs)
 * Uses public ANON key only - no service role credentials
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types.generated";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for reuse across the app
let client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
