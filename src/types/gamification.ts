export interface UserStats {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompletedToday: number;
  tasksCompletedTotal: number;
  // Profile fields from API
  id?: string;
  display_name?: string;
  avatar_url?: string | null;
  timezone?: string;
  teaching_days?: string;
  college_start?: string;
  college_end?: string;
  teaching_start?: string;
  teaching_end?: string;
  created_at?: string;
  updated_at?: string;
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
