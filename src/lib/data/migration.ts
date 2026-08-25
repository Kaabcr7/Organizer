/**
 * Migration strategy for transitioning from localStorage to Supabase
 * Safely migrates existing local users to authenticated Supabase users
 */

import { getClient } from "@/lib/supabase";
import type { AppState } from "@/lib/store/types";

const LOCAL_STORAGE_KEY = "organizer-state";
const MIGRATION_KEY = "organizer-migration-complete";

/**
 * Check if user has local data that needs migration
 */
export function hasLocalData(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const migrated = localStorage.getItem(MIGRATION_KEY);
    return !!stored && !migrated;
  } catch {
    return false;
  }
}

/**
 * Get existing local state for migration
 */
export function getLocalState(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AppState;
  } catch {
    return null;
  }
}

/**
 * Migrate local tasks to Supabase
 * Only called after user authenticates
 */
export async function migrateLocalDataToSupabase(
  userId: string,
  localState: AppState
): Promise<{ success: boolean; tasksCount: number; error?: string }> {
  const client = getClient();

  try {
    // Migrate today's tasks
    const today = new Date().toISOString().split("T")[0];
    const todaysTasks = localState.tasks.filter((t) => t.date === today);

    for (const task of todaysTasks) {
      await client.from("task_instances").insert({
        user_id: userId,
        date: task.date,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        difficulty: task.difficulty,
        xp_reward: task.xpReward,
        estimated_minutes: task.estimatedMinutes,
        due_time: task.dueTime,
        completed: task.completed,
        completed_at: task.completedAt,
        notes: task.notes,
      });
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, "true");

    // Keep localStorage for now (graceful fallback)
    // User can opt to delete it manually if they prefer

    return { success: true, tasksCount: todaysTasks.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Migration failed";
    return { success: false, tasksCount: 0, error: message };
  }
}

/**
 * Clear local storage (called after successful migration verification)
 */
export function clearLocalStorageAfterMigration(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(MIGRATION_KEY);
  } catch {
    // Silently fail
  }
}
