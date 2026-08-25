"use client";

import { useState } from "react";
import { DailyHeader } from "@/components/home/daily-header";
import { TaskList } from "@/components/home/task-list";
import { SchedulePreview } from "@/components/home/schedule-preview";
import { NextAction } from "@/components/home/next-action";
import { CarryForwardBanner } from "@/components/home/carry-forward-banner";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/lib/store";
import { getNextTask } from "@/lib/domain/tasks";
import type { Task } from "@/types/task";

export default function HomePage() {
  const { state, completionPercentage } = useApp();
  const { tasks, stats, schedule } = state;
  const nextTask = getNextTask(tasks);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  return (
    <div className="space-y-6">
      <DailyHeader stats={stats} completionPercent={completionPercentage} />

      <Separator />

      <NextAction task={nextTask} />

      {/* Carry-forward from yesterday */}
      <CarryForwardBanner />

      {/* Two-column on desktop: tasks + schedule */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <div />
            <TaskDialog />
          </div>
          <TaskList tasks={tasks} onEditTask={setEditingTask} />
        </div>
        <div className="lg:col-span-2">
          <SchedulePreview schedule={schedule} />
        </div>
      </div>

      {/* Edit dialog (controlled externally) */}
      <TaskDialog
        editTask={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        showTrigger={false}
      />
    </div>
  );
}
