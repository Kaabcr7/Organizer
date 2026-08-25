export interface UserStats {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompletedToday: number;
  tasksCompletedTotal: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
}

export type XpTier = "small" | "normal" | "important" | "major";

export const XP_VALUES: Record<XpTier, number> = {
  small: 10,
  normal: 25,
  important: 50,
  major: 100,
} as const;
