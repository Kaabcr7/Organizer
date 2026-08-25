import { LEVEL_XP_TABLE } from "@/lib/constants";
import type { UserStats } from "@/types/gamification";

/**
 * Calculate level from total XP.
 */
export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_XP_TABLE.length; i++) {
    if (totalXp >= LEVEL_XP_TABLE[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Calculate progress percentage toward the next level.
 */
export function getLevelProgress(stats: UserStats): number {
  const xpIntoLevel = stats.totalXp - stats.xpForCurrentLevel;
  const xpNeededForLevel = stats.xpForNextLevel - stats.xpForCurrentLevel;
  if (xpNeededForLevel <= 0) return 100;
  return Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100));
}

/**
 * Format XP as a short readable string.
 */
export function formatXp(xp: number): string {
  if (xp >= 10000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toLocaleString();
}
