import type { AppState } from "./types";
import { getTodayDate } from "@/lib/domain/daily-state";

export function createInitialState(): AppState {
  const today = getTodayDate();

  return {
    today,
    tasks: [],
    schedule: { date: today, isTeachingDay: false, blocks: [] },
    stats: {
      totalXp: 0,
      level: 1,
      xpForCurrentLevel: 0,
      xpForNextLevel: 100,
      currentStreak: 0,
      longestStreak: 0,
      tasksCompletedToday: 0,
      tasksCompletedTotal: 0,
    },
    achievements: [],
    history: {},
    recurringTemplates: [],
    xpAnimations: [],
    levelUpEvent: null,
  };
}
