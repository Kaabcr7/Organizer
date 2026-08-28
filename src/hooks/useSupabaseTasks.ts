/**
 * Hook for task operations with Supabase integration
 * Handles create, update, delete, complete, undo operations
 */

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRepositories } from "./useRepositories";
import { useApp } from "@/lib/store";
import { getTodayDate } from "@/lib/domain/daily-state";
import type { NewTaskInput } from "@/lib/store/types";
import type { Task, TaskCategory } from "@/types/task";

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

export interface TaskOperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export function useSupabaseTasks() {
  const { user } = useAuth();
  const repos = useRepositories();
  const { dispatch } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

/**
 * Create a new task in Supabase
 */
const createTask = useCallback(
    async (input: NewTaskInput): Promise<TaskOperationResult> => {
      if (!user) return { success: false, error: "Not authenticated" };

      setIsLoading(true);
      setError(null);

      try {
        const today = getTodayDate();
        const task = await repos.tasks.createTask({
          user_id: user.id,
          date: today,
          title: input.title,
          description: input.description,
          category: input.category as TaskCategory,
          priority: input.priority,
          difficulty: input.difficulty,
          xp_reward:
            input.difficulty === "easy"
              ? 10
              : input.difficulty === "medium"
                ? 25
                : input.difficulty === "hard"
                  ? 50
                  : 100,
          estimated_minutes: input.estimatedMinutes,
          due_time: input.dueTime,
          completed: false,
          template_id: input.isRecurring ? undefined : null,
        });

        // Add to local state (optimistic update) - Task requires all fields
        const xpReward =
          input.difficulty === "easy"
            ? 10
            : input.difficulty === "medium"
            ? 25
            : input.difficulty === "hard"
            ? 50
            : 100;
        const optimisticTask: Task = {
          id: task.id || `temp-${Date.now()}`,
          title: input.title,
          description: input.description,
          category: input.category as TaskCategory,
          priority: input.priority,
          difficulty: input.difficulty,
          xpReward,
          estimatedMinutes: input.estimatedMinutes,
          dueTime: input.dueTime,
          completed: false,
          isRecurring: input.isRecurring,
          date: today,
        };
        dispatch({
          type: "ADD_TASK",
          task: optimisticTask,
        });

        return { success: true, data: task };
      } catch (err) {
        const message = formatError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [user, repos.tasks, dispatch]
  );

  /**
   * Update an existing task
   */
  const updateTask = useCallback(
    async (
      taskId: string,
      updates: Partial<NewTaskInput>
    ): Promise<TaskOperationResult> => {
      if (!user) return { success: false, error: "Not authenticated" };

      setIsLoading(true);
      setError(null);

      try {
        // Map local types to Supabase types
        const supabaseUpdates: Record<string, unknown> = {};
        if (updates.title) supabaseUpdates.title = updates.title;
        if (updates.description) supabaseUpdates.description = updates.description;
        if (updates.priority) supabaseUpdates.priority = updates.priority;
        if (updates.difficulty) supabaseUpdates.difficulty = updates.difficulty;
        if (updates.dueTime) supabaseUpdates.due_time = updates.dueTime;
        if (updates.estimatedMinutes)
          supabaseUpdates.estimated_minutes = updates.estimatedMinutes;

        const task = await repos.tasks.updateTask(taskId, supabaseUpdates as Record<string, unknown>);

        // Update local state (optimistic update)
        dispatch({
          type: "EDIT_TASK",
          taskId,
          updates,
        });

        return { success: true, data: task };
      } catch (err) {
        const message = formatError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [user, repos.tasks, dispatch]
  );

  /**
   * Delete a task
   */
  const deleteTask = useCallback(
    async (taskId: string): Promise<TaskOperationResult> => {
      if (!user) return { success: false, error: "Not authenticated" };

      setIsLoading(true);
      setError(null);

      try {
        await repos.tasks.deleteTask(taskId);

        // Update local state (optimistic update)
        dispatch({
          type: "DELETE_TASK",
          taskId,
        });

        return { success: true };
      } catch (err) {
        const message = formatError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [user, repos.tasks, dispatch]
  );

  /**
   * Complete a task (uses RPC for atomic XP award)
   */
  const completeTask = useCallback(
    async (taskId: string): Promise<TaskOperationResult> => {
      if (!user) return { success: false, error: "Not authenticated" };

      setIsLoading(true);
      setError(null);

      try {
        // Call RPC function
        const result = await repos.tasks.completeTask(
          taskId,
          `task-${taskId}-${Date.now()}` // Idempotency key
        );

        // Update local state with optimistic UI
        dispatch({
          type: "COMPLETE_TASK",
          taskId,
        });

        return { success: true, data: result };
      } catch (err) {
        const message = formatError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [user, repos.tasks, dispatch]
  );

  /**
   * Undo task completion (reverses XP award)
   */
  const undoCompleteTask = useCallback(
    async (taskId: string): Promise<TaskOperationResult> => {
      if (!user) return { success: false, error: "Not authenticated" };

      setIsLoading(true);
      setError(null);

      try {
        // Call RPC function
        const result = await repos.tasks.undoCompleteTask(taskId);

        // Update local state
        dispatch({
          type: "UNCOMPLETE_TASK",
          taskId,
        });

        return { success: true, data: result };
      } catch (err) {
        const message = formatError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [user, repos.tasks, dispatch]
  );

  return {
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    undoCompleteTask,
    isLoading,
    error,
  };
}
