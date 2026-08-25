import type { TaskCategory, TaskPriority } from "@/types/task";
import type { ScheduleBlockType } from "@/types/schedule";

/**
 * Category metadata: colors, labels, and icons (Lucide icon names).
 */
export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; color: string; iconName: string }
> = {
  college: { label: "College", color: "var(--cat-college)", iconName: "GraduationCap" },
  dsa: { label: "DSA", color: "var(--cat-dsa)", iconName: "Code2" },
  "ml-ai": { label: "ML / AI", color: "var(--cat-ml)", iconName: "Brain" },
  projects: { label: "Projects", color: "var(--cat-projects)", iconName: "Rocket" },
  fitness: { label: "Fitness", color: "var(--cat-fitness)", iconName: "Dumbbell" },
  personal: { label: "Personal", color: "var(--cat-personal)", iconName: "User" },
  teaching: { label: "Teaching", color: "var(--cat-teaching)", iconName: "Presentation" },
  other: { label: "Other", color: "var(--cat-other)", iconName: "MoreHorizontal" },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; weight: number }
> = {
  low: { label: "Low", color: "var(--priority-low)", weight: 1 },
  normal: { label: "Normal", color: "var(--priority-normal)", weight: 2 },
  high: { label: "High", color: "var(--priority-high)", weight: 3 },
  critical: { label: "Critical", color: "var(--priority-critical)", weight: 4 },
};

export const SCHEDULE_BLOCK_CONFIG: Record<
  ScheduleBlockType,
  { label: string; color: string }
> = {
  college: { label: "College", color: "var(--cat-college)" },
  teaching: { label: "Teaching", color: "var(--cat-teaching)" },
  dsa: { label: "DSA", color: "var(--cat-dsa)" },
  "ml-ai": { label: "ML / AI", color: "var(--cat-ml)" },
  projects: { label: "Projects", color: "var(--cat-projects)" },
  fitness: { label: "Fitness", color: "var(--cat-fitness)" },
  personal: { label: "Personal", color: "var(--cat-personal)" },
  free: { label: "Free", color: "var(--muted)" },
};

/**
 * XP required per level. Level N requires LEVEL_XP_TABLE[N] total XP.
 * Grows quadratically for a satisfying progression curve.
 */
export const LEVEL_XP_TABLE: number[] = [
  0, // Level 0 (unused)
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  850, // Level 5
  1300, // Level 6
  1900, // Level 7
  2600, // Level 8
  3500, // Level 9
  4600, // Level 10
  5900, // Level 11
  7500, // Level 12
  9400, // Level 13
  11600, // Level 14
  14200, // Level 15
];

export const NAV_ITEMS = [
  { href: "/", label: "Home", iconName: "LayoutDashboard" },
  { href: "/schedule", label: "Schedule", iconName: "Calendar" },
  { href: "/tasks", label: "Tasks", iconName: "CheckSquare" },
  { href: "/stats", label: "Stats", iconName: "BarChart3" },
  { href: "/focus", label: "Focus", iconName: "Target" },
  { href: "/settings", label: "Settings", iconName: "Settings" },
] as const;

export const TEACHING_DAYS = [1, 3, 5] as const; // Monday, Wednesday, Friday
