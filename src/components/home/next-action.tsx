"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { Task } from "@/types/task";

interface NextActionProps {
  task: Task | null;
}

export function NextAction({ task }: NextActionProps) {
  if (!task) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-6 text-center backdrop-blur-sm"
      >
        <motion.p
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
          className="text-sm font-semibold text-foreground"
        >
          🎉 All tasks complete!
        </motion.p>
        <p className="mt-1 text-xs text-muted-foreground">
          Great work today. Take a well-deserved break.
        </p>
      </motion.div>
    );
  }

  const category = CATEGORY_CONFIG[task.category];

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Next Up
      </h3>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="group relative rounded-xl border-2 px-4 py-4 transition-all duration-200 hover:shadow-lg"
        style={{
          borderColor: `color-mix(in oklch, ${category.color} 40%, var(--border))`,
          backgroundColor: `color-mix(in oklch, ${category.color} 8%, var(--background))`,
        }}
      >
        {/* Category indicator bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: category.color }}
        />

        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-2 pl-1">
            <p className="text-base font-bold leading-tight">{task.title}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {category.label}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-md bg-background/50 px-2 py-0.5 text-xs font-semibold"
                style={{ color: "var(--xp-color)" }}
              >
                +{task.xpReward} XP
              </span>
              {task.estimatedMinutes && (
                <span className="text-xs text-muted-foreground">
                  ~{task.estimatedMinutes}m
                </span>
              )}
            </div>
          </div>

          {/* Action arrow */}
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex shrink-0 items-center justify-center"
          >
            <ArrowRight className="h-5 w-5 text-foreground/60" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
