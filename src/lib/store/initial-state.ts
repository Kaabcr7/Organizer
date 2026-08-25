import type { AppState } from "./types";
import { getMockTasks } from "@/lib/data/mock-tasks";
import { getMockStats } from "@/lib/data/mock-stats";
import { getMockAchievements } from "@/lib/data/mock-stats";
import { getMockSchedule } from "@/lib/data/mock-schedule";
import { getTodayDate } from "@/lib/domain/daily-state";
import { getCompletionPercentage, getEarnedXp } from "@/lib/domain/tasks";

export function createInitialState(): AppState {
  const today = getTodayDate();
  const tasks = getMockTasks();
  const stats = getMockStats();
  const achievements = getMockAchievements();
  const schedule = getMockSchedule();

  // Identify recurring templates from mock tasks
  const recurringTemplates = tasks.filter((t) => t.isRecurring);

  return {
    today,
    tasks,
    schedule,
    stats: {
      ...stats,
      tasksCompletedToday: tasks.filter((t) => t.completed).length,
    },
    achievements,
    history: {
      [today]: {
        date: today,
        tasks,
        totalXpEarned: getEarnedXp(tasks),
        completionPercentage: getCompletionPercentage(tasks),
      },
    },
    recurringTemplates,
    xpAnimations: [],
    levelUpEvent: null,
  };
}
