export type TaskCategory =
  | "college"
  | "dsa"
  | "ml-ai"
  | "projects"
  | "fitness"
  | "personal"
  | "teaching"
  | "other";

export type TaskPriority = "low" | "normal" | "high" | "critical";

export type TaskDifficulty = "easy" | "medium" | "hard" | "epic";

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  xpReward: number;
  estimatedMinutes?: number;
  dueTime?: string;
  completed: boolean;
  completedAt?: string;
  isRecurring: boolean;
  notes?: string;
  date: string; // ISO date string YYYY-MM-DD
}

export interface DailyState {
  date: string;
  tasks: Task[];
  totalXpEarned: number;
  completionPercentage: number;
}
