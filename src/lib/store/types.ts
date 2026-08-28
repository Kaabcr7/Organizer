import type { Task, TaskCategory, TaskPriority, TaskDifficulty } from "@/types/task";
import type { UserStats, Achievement } from "@/types/gamification";
import type { DaySchedule } from "@/types/schedule";

export interface AppState {
  // Current day
  today: string; // YYYY-MM-DD
  tasks: Task[];
  schedule: DaySchedule;
  stats: UserStats;
  achievements: Achievement[];

  // History (previous days preserved)
  history: Record<string, HistoricalDay>;

  // Recurring task templates
  recurringTemplates: Task[];

  // XP animation queue
  xpAnimations: XpAnimation[];

  // Level-up event (when non-null, show level-up modal)
  levelUpEvent: LevelUpEvent | null;
}

export interface HistoricalDay {
  date: string;
  tasks: Task[];
  totalXpEarned: number;
  completionPercentage: number;
}

export interface XpAnimation {
  id: string;
  amount: number;
  taskTitle: string;
  timestamp: number;
}

export interface LevelUpEvent {
  previousLevel: number;
  newLevel: number;
  timestamp: number;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  estimatedMinutes?: number;
  dueTime?: string;
  isRecurring: boolean;
}

export type AppAction =
  | { type: "COMPLETE_TASK"; taskId: string }
  | { type: "UNCOMPLETE_TASK"; taskId: string }
  | { type: "ADD_TASK"; task: Task }
  | { type: "REPLACE_TASK"; oldId: string; newTask: Task }
  | { type: "EDIT_TASK"; taskId: string; updates: Partial<Task> }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "DISMISS_XP_ANIMATION"; animationId: string }
  | { type: "DISMISS_LEVEL_UP" }
  | { type: "CARRY_FORWARD_TASK"; taskId: string; fromDate: string }
  | { type: "ROLLOVER_DAY" }
  | { type: "HYDRATE"; state: AppState };
