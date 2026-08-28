/**
 * Hook for achievements API operations
 */

import { useState, useCallback, useEffect } from "react";
import { achievementsApi, ApiError } from "@/lib/api/client";
import type { Achievement } from "@/types/gamification";

export interface UseApiAchievementsState {
  achievements: Achievement[] | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseApiAchievementsActions {
  fetchAchievements: () => Promise<Achievement[]>;
  clearError: () => void;
}

export function useApiAchievements(): UseApiAchievementsState & UseApiAchievementsActions {
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await achievementsApi.getAchievements();
      setAchievements(data);
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
    fetchAchievements().catch(() => {
      // Error already set in state
    });
  }, [fetchAchievements]);

  return {
    achievements,
    loading,
    error,
    fetchAchievements,
    clearError,
  };
}
