/**
 * Hook for schedule API operations
 */

import { useState, useCallback } from "react";
import { scheduleApi, ApiError } from "@/lib/api/client";

export interface UseApiScheduleState {
  schedule: any[] | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseApiScheduleActions {
  fetchSchedule: () => Promise<any[]>;
  updateScheduleBlock: (id: string, updates: Record<string, any>) => Promise<any>;
  deleteScheduleBlock: (id: string) => Promise<void>;
  clearError: () => void;
}

export function useApiSchedule(): UseApiScheduleState & UseApiScheduleActions {
  const [schedule, setSchedule] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleApi.getSchedule();
      setSchedule(data);
      return data;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateScheduleBlock = useCallback(async (id: string, updates: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleApi.updateScheduleBlock(id, updates);
      // Update local state
      setSchedule((prev) => prev?.map((block) => (block.id === id ? data : block)) || []);
      return data;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteScheduleBlock = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await scheduleApi.deleteScheduleBlock(id);
      // Update local state
      setSchedule((prev) => prev?.filter((block) => block.id !== id) || []);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    schedule,
    loading,
    error,
    fetchSchedule,
    updateScheduleBlock,
    deleteScheduleBlock,
    clearError,
  };
}