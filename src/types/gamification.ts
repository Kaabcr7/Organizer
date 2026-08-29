export interface UserStats {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompletedToday: number;
  tasksCompletedTotal: number;

  // Profile fields, normalised to camelCase by lib/api/client.ts.
  // Times are "HH:MM"; teachingDays is a JSON array of ISO weekdays ("[1,3,5]").
  id?: string;
  displayName?: string;
  avatarUrl?: string | null;
  timezone?: string;
  teachingDays?: string | null;
  collegeStart?: string;
  collegeEnd?: string;
  teachingStart?: string;
  teachingEnd?: string;
  createdAt?: string;
  updatedAt?: string;

  // Raw snake_case keys as they arrive on the wire. Kept because the API
  // client spreads the original row; prefer the camelCase fields above.
  display_name?: string;
  avatar_url?: string | null;
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
