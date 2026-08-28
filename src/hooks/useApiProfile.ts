/**
 * Hook for profile/stats API operations
 */

import { useState, useCallback, useEffect } from "react";
import { profileApi, ApiError } from "@/lib/api/client";
import type { UserStats } from "@/types/gamification";

export interface UseApiProfileState {
  profile: UserStats | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseApiProfileActions {
  fetchProfile: () => Promise<UserStats>;
  updateProfile: (updates: Record<string, any>) => Promise<any>;
  clearError: () => void;
}

export function useApiProfile(): UseApiProfileState & UseApiProfileActions {
  const [profile, setProfile] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileApi.getProfile();
      setProfile(data);
      return data;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileApi.updateProfile(updates);
      setProfile(data);
      return data;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchProfile().catch(() => {
      // Error already set in state
    });
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    clearError,
  };
}
