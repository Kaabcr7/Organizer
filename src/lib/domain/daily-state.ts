import type { Task } from "@/types/task";
import type { DailyState } from "@/types/task";
import { getCompletionPercentage, getEarnedXp } from "./tasks";

/**
 * Get today's ISO date string (YYYY-MM-DD).
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Create a fresh daily state for a given date.
 */
export function createDailyState(date: string, tasks: Task[]): DailyState {
  const dateTasks = tasks.filter((t) => t.date === date);
  return {
    date,
    tasks: dateTasks,
    totalXpEarned: getEarnedXp(dateTasks),
    completionPercentage: getCompletionPercentage(dateTasks),
  };
}

/**
 * Check if a new day has started relative to a stored date.
 */
export function isNewDay(storedDate: string): boolean {
  return getTodayDate() !== storedDate;
}

/**
 * Generate today's recurring tasks from a template set.
 * Each recurring task gets a fresh instance for today's date.
 */
export function generateRecurringTasks(
  recurringTemplates: Task[],
  date: string
): Task[] {
  return recurringTemplates.map((template) => ({
    ...template,
    id: `${template.id}-${date}`,
    date,
    completed: false,
    completedAt: undefined,
  }));
}

/**
 * Carry forward specific incomplete tasks from a previous day to today.
 */
export function carryForwardTasks(tasks: Task[], date: string): Task[] {
  return tasks
    .filter((t) => !t.completed)
    .map((t) => ({
      ...t,
      id: `${t.id}-carried-${date}`,
      date,
    }));
}

/**
 * Recalculate daily state from the current tasks.
 */
export function recalculateDailyState(state: DailyState): DailyState {
  return {
    ...state,
    totalXpEarned: getEarnedXp(state.tasks),
    completionPercentage: getCompletionPercentage(state.tasks),
  };
}
