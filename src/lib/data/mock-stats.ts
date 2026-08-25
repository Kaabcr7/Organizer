import type { UserStats, Achievement } from "@/types/gamification";

export function getMockStats(): UserStats {
  return {
    totalXp: 1420,
    level: 6,
    xpForCurrentLevel: 1300,
    xpForNextLevel: 1900,
    currentStreak: 12,
    longestStreak: 18,
    tasksCompletedToday: 2,
    tasksCompletedTotal: 147,
  };
}

export function getMockAchievements(): Achievement[] {
  return [
    {
      id: "ach-1",
      title: "First Steps",
      description: "Complete your first task",
      icon: "Footprints",
      unlockedAt: "2026-08-10T09:00:00",
      isUnlocked: true,
    },
    {
      id: "ach-2",
      title: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "Flame",
      unlockedAt: "2026-08-17T22:00:00",
      isUnlocked: true,
    },
    {
      id: "ach-3",
      title: "Centurion",
      description: "Complete 100 tasks total",
      icon: "Trophy",
      unlockedAt: "2026-08-20T18:30:00",
      isUnlocked: true,
    },
    {
      id: "ach-4",
      title: "Level 10",
      description: "Reach level 10",
      icon: "Star",
      isUnlocked: false,
    },
    {
      id: "ach-5",
      title: "Perfect Day",
      description: "Complete all tasks in a single day",
      icon: "Crown",
      isUnlocked: false,
    },
    {
      id: "ach-6",
      title: "Iron Discipline",
      description: "Maintain a 30-day streak",
      icon: "Shield",
      isUnlocked: false,
    },
  ];
}
