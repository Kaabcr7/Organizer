"use client";

import { AnimatePresence } from "motion/react";
import { TaskItem } from "./task-item";
import type { Task } from "@/types/task";

interface TaskListProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
}

export function TaskList({ tasks, onEditTask }: TaskListProps) {
  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Today&apos;s Tasks</h2>
        <span className="text-xs text-muted-foreground">
          {completed.length}/{tasks.length} complete
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {incomplete.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={onEditTask} />
          ))}
          {completed.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
