"use client";

import { Check, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from "@/lib/constants";
import { useApp } from "@/lib/store";
import type { Task } from "@/types/task";

interface TaskItemProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export function TaskItem({ task, onEdit }: TaskItemProps) {
  const { completeTask, uncompleteTask, deleteTask } = useApp();
  const category = CATEGORY_CONFIG[task.category];
  const priority = PRIORITY_CONFIG[task.priority];
  const isHighPriority = task.priority === "high" || task.priority === "critical";

  function handleToggle() {
    if (task.completed) {
      uncompleteTask(task.id);
    } else {
      completeTask(task.id);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-200",
        task.completed
          ? "border-border/40 bg-muted/15 backdrop-blur-sm"
          : "border-border hover:border-foreground/30 hover:bg-card/50 hover:shadow-sm",
        isHighPriority && !task.completed && "border-l-2",
      )}
      style={isHighPriority && !task.completed ? { borderLeftColor: priority.color } : undefined}
    >
      {/* Enhanced completion button */}
      <button
        onClick={handleToggle}
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
          task.completed
            ? "border-foreground/40 bg-gradient-to-br from-foreground/20 to-foreground/10"
            : "border-muted-foreground/40 hover:border-foreground/60 hover:scale-110"
        )}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        <AnimatePresence>
          {task.completed && (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Check className="h-3.5 w-3.5 text-foreground/70" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Task content */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-tight transition-all duration-200",
              task.completed && "line-through text-muted-foreground opacity-60"
            )}
          >
            {task.title}
          </p>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category badge with color */}
          <motion.div
            whileHover={!task.completed ? { scale: 1.05 } : undefined}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Badge
              variant="secondary"
              className="h-5 px-2 text-[11px] font-semibold transition-all duration-200"
              style={{
                color: category.color,
                backgroundColor: `color-mix(in oklch, ${category.color} 15%, transparent)`,
                borderColor: category.color,
              }}
            >
              {category.label}
            </Badge>
          </motion.div>

          {/* Duration */}
          {task.estimatedMinutes && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes}m
            </span>
          )}

          {/* XP Reward - Highlighted */}
          <motion.span
            className="flex items-center gap-1 text-[11px] font-bold transition-colors duration-200"
            style={{ color: "var(--xp-color)" }}
            whileHover={!task.completed ? { scale: 1.1 } : undefined}
          >
            +{task.xpReward} XP
          </motion.span>

          {/* Priority indicator dot */}
          {isHighPriority && (
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse-soft"
              style={{ backgroundColor: priority.color }}
              title={priority.label}
              aria-label={`${priority.label} priority`}
            />
          )}
        </div>
      </div>

      {/* Actions menu - visible on hover/focus on desktop, always accessible on mobile */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="mt-0.5 rounded-md p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-muted focus:opacity-100 active:opacity-100 md:hover:bg-muted/50"
          aria-label="Task actions"
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onEdit && (
            <DropdownMenuItem
              onClick={() => onEdit(task)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              <span>Edit Task</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => deleteTask(task.id)}
            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
