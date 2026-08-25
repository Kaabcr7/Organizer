import type { Task } from "@/types/task";

/**
 * Calculate completion percentage for a list of tasks.
 */
export function getCompletionPercentage(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Get total XP earned from completed tasks.
 */
export function getEarnedXp(tasks: Task[]): number {
  return tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.xpReward, 0);
}

/**
 * Get the next incomplete task by priority weight.
 */
export function getNextTask(tasks: Task[]): Task | null {
  const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
  const incomplete = tasks.filter((t) => !t.completed);
  if (incomplete.length === 0) return null;
  return [...incomplete].sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
  )[0];
}

/**
 * Group tasks by category.
 */
export function groupTasksByCategory(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce(
    (acc, task) => {
      const group = acc[task.category] || [];
      return { ...acc, [task.category]: [...group, task] };
    },
    {} as Record<string, Task[]>
  );
}
