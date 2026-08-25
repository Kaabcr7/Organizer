"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TaskItem } from "@/components/home/task-item";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useApp } from "@/lib/store";
import { getCompletionPercentage, getEarnedXp, groupTasksByCategory } from "@/lib/domain/tasks";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { AnimatePresence } from "motion/react";
import type { Task } from "@/types/task";

export default function TasksPage() {
  const { state } = useApp();
  const { tasks } = state;
  const completion = getCompletionPercentage(tasks);
  const earnedXp = getEarnedXp(tasks);
  const grouped = groupTasksByCategory(tasks);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {completion}% complete · {earnedXp} XP earned today
          </p>
        </div>
        <TaskDialog />
      </div>

      <Separator />

      {/* Grouped by category */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, categoryTasks]) => {
          const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
          return (
            <div key={category}>
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <h3 className="text-sm font-medium">{config.label}</h3>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {categoryTasks.length}
                </Badge>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {categoryTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onEdit={setEditingTask} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit dialog */}
      <TaskDialog
        editTask={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        showTrigger={false}
      />
    </div>
  );
}
