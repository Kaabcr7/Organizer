/**
 * Hook to sync app state with Supabase
 * Loads data from Supabase and syncs changes back
 */

import { useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useRepositories } from "./useRepositories";
import { useApp } from "@/lib/store";
import { getTodayDate } from "@/lib/domain/daily-state";
import { formatSupabaseError } from "@/lib/supabase";
import type { Task, TaskCategory, TaskPriority, TaskDifficulty } from "@/types/task";

export interface UseSupabaseSyncOptions {
  enabled?: boolean;
  autoSync?: boolean;
}

export function useSupabaseSync(options: UseSupabaseSyncOptions = {}) {
  const { enabled = true, autoSync = true } = options;
  const { user, isLoading: authLoading } = useAuth();
  const repos = useRepositories();
  const { state, dispatch } = useApp();

  /**
   * Load today's tasks from Supabase and hydrate the store
   */
  const loadTodaysTasks = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      const tasks = await repos.tasks.getTodaysTasks(user.id, getTodayDate());

      // Convert Supabase task_instances to local Task type
      const localTasks: Task[] = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        category: t.category as TaskCategory,
        priority: t.priority as TaskPriority,
        difficulty: t.difficulty as TaskDifficulty,
        xpReward: t.xp_reward,
        estimatedMinutes: t.estimated_minutes || undefined,
        dueTime: t.due_time || undefined,
        completed: t.completed,
        completedAt: t.completed_at || undefined,
        isRecurring: t.template_id !== null,
        notes: t.notes || undefined,
        date: t.date,
      }));

      // Dispatch to store (this will update localStorage too)
      dispatch({
        type: "HYDRATE",
        state: {
          ...state,
          tasks: localTasks,
        },
      });
    } catch (err) {
      console.error("Failed to load tasks:", formatSupabaseError(err));
    }
  }, [user, enabled, repos.tasks, state, dispatch]);

  /**
   * Sync profile data (XP, level, etc.) from Supabase
   */
  const loadProfile = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      const profile = await repos.profiles.getProfile(user.id);
      if (!profile) return;

      // Update stats in store
      dispatch({
        type: "HYDRATE",
        state: {
          ...state,
          stats: {
            ...state.stats,
            totalXp: profile.total_xp,
            level: profile.level,
            currentStreak: profile.current_streak,
            longestStreak: profile.longest_streak,
            tasksCompletedTotal: profile.tasks_completed_total,
          },
        },
      });
    } catch (err) {
      console.error("Failed to load profile:", formatSupabaseError(err));
    }
  }, [user, enabled, repos.profiles, state, dispatch]);

  /**
   * Sync achievements from Supabase
   */
  const loadAchievements = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      const achievements = await repos.achievements.getAllAchievements();
      const unlockedIds = await repos.achievements.getUnlockedAchievementIds(
        user.id
      );

      const localAchievements = achievements.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        isUnlocked: unlockedIds.includes(a.id),
      }));

      dispatch({
        type: "HYDRATE",
        state: {
          ...state,
          achievements: localAchievements,
        },
      });
    } catch (err) {
      console.error("Failed to load achievements:", formatSupabaseError(err));
    }
  }, [user, enabled, repos.achievements, state, dispatch]);

  /**
   * Sync recurring templates from Supabase
   */
  const loadRecurringTemplates = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      const templates = await repos.recurringTemplates.getActiveTemplates(
        user.id
      );

      const localTemplates: Task[] = templates.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        category: t.category as TaskCategory,
        priority: t.priority as TaskPriority,
        difficulty: t.difficulty as TaskDifficulty,
        xpReward: t.xp_reward,
        estimatedMinutes: t.estimated_minutes || undefined,
        dueTime: t.due_time || undefined,
        completed: false,
        isRecurring: true,
        date: "", // Templates don't have a specific date
      }));

      dispatch({
        type: "HYDRATE",
        state: {
          ...state,
          recurringTemplates: localTemplates,
        },
      });
    } catch (err) {
      console.error(
        "Failed to load recurring templates:",
        formatSupabaseError(err)
      );
    }
  }, [user, enabled, repos.recurringTemplates, state, dispatch]);

  /**
   * Initial sync on mount when auth is ready
   */
  useEffect(() => {
    if (authLoading || !user || !autoSync) return;

    // Load all data in parallel
    Promise.all([
      loadTodaysTasks(),
      loadProfile(),
      loadAchievements(),
      loadRecurringTemplates(),
    ]).catch((err) => {
      console.error("Supabase sync failed:", err);
    });
  }, [
    authLoading,
    user,
    autoSync,
    loadTodaysTasks,
    loadProfile,
    loadAchievements,
    loadRecurringTemplates,
  ]);

  return {
    loadTodaysTasks,
    loadProfile,
    loadAchievements,
    loadRecurringTemplates,
  };
}
