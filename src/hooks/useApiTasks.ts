/**
 * Hook for task API operations with error handling
 * Replaces dispatch(COMPLETE_TASK) calls
 */

import { useState, useCallback } from "react";
import { tasksApi, ApiError } from "@/lib/api/client";
import type { Task } from "@/types/task";

export interface UseApiTasksState {
  loading: boolean;
  error: ApiError | null;
}

export interface UseApiTasksActions {
  getTodaysTasks: (date: string) => Promise<Task[]>;
  createTask: (payload: any) => Promise<Task>;
  updateTask: (id: string, updates: any) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string, idempotencyKey?: string) => Promise<any>;
  undoCompleteTask: (id: string) => Promise<any>;
  carryForwardTask: (id: string, date: string) => Promise<any>;
  clearError: () => void;
}

export function useApiTasks(): UseApiTasksState & UseApiTasksActions {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getTodaysTasks = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const tasks = await tasksApi.getTodaysTasks(date);
      return tasks;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (payload: any) => {
    try {
      setLoading(true);
      setError(null);
      const task = await tasksApi.createTask(payload);
      return task;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);
      const task = await tasksApi.updateTask(id, updates);
      return task;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await tasksApi.deleteTask(id);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeTask = useCallback(async (id: string, idempotencyKey?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await tasksApi.completeTask(id, idempotencyKey);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const undoCompleteTask = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await tasksApi.undoCompleteTask(id);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const carryForwardTask = useCallback(async (id: string, date: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await tasksApi.carryForwardTask(id, date);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, "unknown", String(err));
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getTodaysTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    undoCompleteTask,
    carryForwardTask,
    clearError,
  };
}
