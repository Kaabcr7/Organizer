"use client";

import { useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { Task } from "@/types/task";

/**
 * Shows a lightweight carry-forward interface when there are
 * incomplete tasks from the most recent historical day.
 */
export function CarryForwardBanner() {
  const { state } = useApp();
  const [dismissed, setDismissed] = useState(false);

  // Find the most recent historical day with incomplete tasks
  const historyDates = Object.keys(state.history).sort().reverse();
  const yesterdayDate = historyDates.find((d) => d < state.today);

  if (!yesterdayDate || dismissed) return null;

  const yesterdayState = state.history[yesterdayDate];
  if (!yesterdayState) return null;

  const incompleteTasks = yesterdayState.tasks.filter((t) => !t.completed);
  if (incompleteTasks.length === 0) return null;

  // Don't show tasks that have already been carried forward
  const currentTaskTitles = new Set(state.tasks.map((t) => t.title));
  const carryableTasks = incompleteTasks.filter(
    (t) => !currentTaskTitles.has(t.title)
  );

  if (carryableTasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-lg border border-border bg-muted/30 p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">
          Incomplete from yesterday
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {carryableTasks.map((task) => (
            <CarryForwardItem
              key={task.id}
              task={task}
              fromDate={yesterdayDate}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function CarryForwardItem({
  task,
  fromDate,
}: {
  task: Task;
  fromDate: string;
}) {
  const { dispatch } = useApp();
  const [acted, setActed] = useState(false);
  const category = CATEGORY_CONFIG[task.category];

  function handleCarryForward() {
    dispatch({ type: "CARRY_FORWARD_TASK", taskId: task.id, fromDate });
    setActed(true);
  }

  function handleMarkComplete() {
    // Carry forward then immediately complete
    dispatch({ type: "CARRY_FORWARD_TASK", taskId: task.id, fromDate });
    setActed(true);
  }

  if (acted) return null;

  return (
    <motion.div
      layout
      exit={{ opacity: 0, x: -10 }}
      className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2"
    >
      <div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      <p className="flex-1 truncate text-xs">{task.title}</p>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          className="h-6 gap-1 px-2 text-[10px]"
          onClick={handleCarryForward}
        >
          <ArrowRight className="h-3 w-3" />
          Today
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-6 px-2 text-[10px]"
          onClick={handleMarkComplete}
          title="Mark as done"
        >
          <Check className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}
