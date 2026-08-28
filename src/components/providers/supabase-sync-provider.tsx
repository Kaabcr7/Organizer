"use client";

import { useAuth } from "@/lib/auth";

/**
 * Auth-aware provider that shows loading state while auth resolves.
 * Data sync is handled by the AppProvider via API hooks.
 */
export function SupabaseSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: authLoading } = useAuth();

  // Show loading while auth is resolving to avoid hydration mismatches
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
 * No-op initializer - data sync is now handled by AppProvider via API hooks.
 */
export function SupabaseSyncInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
