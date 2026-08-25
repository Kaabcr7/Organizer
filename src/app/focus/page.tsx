"use client";

import { useState } from "react";
import { Play, Pause, Square, RotateCcw, Check } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { useApp } from "@/lib/store";
import { useTimer } from "@/hooks/use-timer";
import type { Task } from "@/types/task";

function formatTimerDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function FocusPage() {
  const { state, completeTask } = useApp();
  const { tasks } = state;
  const timer = useTimer();

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    incompleteTasks[0]?.id ?? ""
  );

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) as Task | undefined;
  const category = selectedTask
    ? CATEGORY_CONFIG[selectedTask.category]
    : null;

  function handleStart() {
    if (!selectedTask) return;
    const duration = selectedTask.estimatedMinutes ?? 25;
    timer.start(duration);
  }

  function handleComplete() {
    if (selectedTask && !selectedTask.completed) {
      completeTask(selectedTask.id);
    }
    timer.reset();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Focus Mode</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deep work, no distractions
        </p>
      </div>

      <Separator />

      {/* Focus session */}
      <div className="mx-auto max-w-md">
        {/* Task selector (only when idle) */}
        {timer.status === "idle" && (
          <div className="mb-6 space-y-2">
            <label className="text-sm font-medium">Select a task to focus on</label>
            <Select value={selectedTaskId} onValueChange={(v) => v && setSelectedTaskId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a task..." />
              </SelectTrigger>
              <SelectContent>
                {incompleteTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Card className="surface-elevated">
          <CardContent className="flex flex-col items-center p-8">
            {/* Category indicator */}
            {category && (
              <div
                className="mb-4 flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium"
                style={{
                  color: category.color,
                  background: `color-mix(in oklch, ${category.color} 10%, transparent)`,
                }}
              >
                {category.label}
              </div>
            )}

            {/* Task title */}
            <h2 className="text-center text-lg font-semibold">
              {selectedTask?.title ?? "No task selected"}
            </h2>

            {/* Timer display */}
            <div className="my-8">
              <motion.p
                key={timer.remainingSeconds}
                className="text-center font-mono text-5xl font-bold tracking-wider"
                animate={timer.status === "running" ? {} : {}}
              >
                {timer.status === "idle"
                  ? formatTimerDisplay((selectedTask?.estimatedMinutes ?? 25) * 60)
                  : formatTimerDisplay(timer.remainingSeconds)}
              </motion.p>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {timer.status === "idle" && "Ready to start"}
                {timer.status === "running" && "Focusing..."}
                {timer.status === "paused" && "Paused"}
                {timer.status === "completed" && "Session complete!"}
              </p>
            </div>

            {/* Progress bar */}
            <Progress value={timer.progressPercent} className="mb-6 h-1.5 w-full" />

            {/* Controls */}
            <div className="flex items-center gap-3">
              {timer.status === "idle" && (
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={handleStart}
                  disabled={!selectedTask}
                >
                  <Play className="h-4 w-4" />
                  Start Session
                </Button>
              )}

              {timer.status === "running" && (
                <>
                  <Button size="lg" variant="secondary" className="gap-2" onClick={timer.pause}>
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button size="lg" variant="secondary" onClick={timer.complete}>
                    <Square className="h-4 w-4" />
                  </Button>
                </>
              )}

              {timer.status === "paused" && (
                <>
                  <Button size="lg" className="gap-2" onClick={timer.resume}>
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                  <Button size="lg" variant="secondary" onClick={timer.reset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}

              {timer.status === "completed" && (
                <>
                  <Button size="lg" className="gap-2" onClick={handleComplete}>
                    <Check className="h-4 w-4" />
                    Complete Task
                  </Button>
                  <Button size="lg" variant="secondary" onClick={timer.reset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips (only when idle) */}
        {timer.status === "idle" && (
          <div className="mt-6 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Focus Tips
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Put your phone on Do Not Disturb</li>
              <li>• Close unnecessary tabs</li>
              <li>• Work in focused intervals</li>
              <li>• Take short breaks between sessions</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
