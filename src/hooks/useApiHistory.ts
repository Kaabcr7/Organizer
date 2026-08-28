/**
 * Hook for history API operations
 */

import { useState, useCallback } from "react";
import { historyApi, ApiError } from "@/lib/api/client";

export interface UseApiHistoryState {
  history: any[] | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseApiHistoryActions {
  fetchHistory: (startDate: string, endDate: string) => Promise<any[]>;
  fetchDailySummary: (date: string) => Promise<any | null>;
  clearError: () => void;
}

export function useApiHistory(): UseApiHistoryState & UseApiHistoryActions {
  const [history, setHistory] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchHistory = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await historyApi.getHistory(startDate, endDate);
      setHistory(data);
      return data;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDailySummary = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await historyApi.getDailySummary(date);
      return data;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    history,
    loading,
    error,
    fetchHistory,
    fetchDailySummary,
    clearError,
  };
}
