"use client";

import { useEffect } from "react";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/lib/auth";

/**
 * Provider component that syncs app state with Supabase on mount
 * Wraps the app to ensure data is loaded before rendering
 */
export function SupabaseSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: authLoading, user } = useAuth();

  // Only initialize sync on the client after auth is ready
  useEffect(() => {
    if (!authLoading && user) {
      // Sync is auto-triggered by useSupabaseSync hook if enabled
    }
  }, [authLoading, user]);

  // Show nothing while auth is loading to avoid hydration mismatches
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Separate component that handles the actual sync
 * This is only rendered after auth is ready
 */
export function SupabaseSyncInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  useSupabaseSync({ enabled: true, autoSync: true });
  return children;
}
