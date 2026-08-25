"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { Task, TaskCategory, TaskPriority, TaskDifficulty } from "@/types/task";
import type { NewTaskInput } from "@/lib/store";

interface TaskDialogProps {
  /** When provided, dialog opens in edit mode with this task's data preloaded. */
  editTask?: Task | null;
  /** External open state control (used for edit mode). */
  open?: boolean;
  /** External open state setter. */
  onOpenChange?: (open: boolean) => void;
  /** Whether to show a trigger button (for add mode). */
  showTrigger?: boolean;
}

const EMPTY_FORM: NewTaskInput = {
  title: "",
  description: "",
  category: "personal",
  priority: "normal",
  difficulty: "medium",
  estimatedMinutes: undefined,
  dueTime: undefined,
  isRecurring: false,
};

function taskToForm(task: Task): NewTaskInput {
  return {
    title: task.title,
    description: task.description ?? "",
    category: task.category,
    priority: task.priority,
    difficulty: task.difficulty,
    estimatedMinutes: task.estimatedMinutes,
    dueTime: task.dueTime,
    isRecurring: task.isRecurring,
  };
}

function difficultyToXp(difficulty: TaskDifficulty): number {
  switch (difficulty) {
    case "easy": return 10;
    case "medium": return 25;
    case "hard": return 50;
    case "epic": return 100;
  }
}

export function TaskDialog({
  editTask,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: TaskDialogProps) {
  const { addTask, editTask: dispatchEdit } = useApp();
  const [internalOpen, setInternalOpen] = useState(false);
  const [form, setForm] = useState<NewTaskInput>(EMPTY_FORM);
  const [lastEditTaskId, setLastEditTaskId] = useState<string | null>(null);

  const isEditMode = !!editTask;
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  // Derive: if the editTask has changed (new task to edit), reset form to that task's values.
  // This replaces the useEffect pattern.
  const editTaskId = editTask?.id ?? null;
  if (editTaskId !== lastEditTaskId) {
    setLastEditTaskId(editTaskId);
    if (editTask) {
      setForm(taskToForm(editTask));
    } else {
      setForm(EMPTY_FORM);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (isEditMode && editTask) {
      const newXp = difficultyToXp(form.difficulty);
      dispatchEdit(editTask.id, {
        title: form.title.trim(),
        description: form.description || undefined,
        category: form.category,
        priority: form.priority,
        difficulty: form.difficulty,
        xpReward: newXp,
        estimatedMinutes: form.estimatedMinutes,
        dueTime: form.dueTime,
        isRecurring: form.isRecurring,
      });
    } else {
      addTask(form);
    }

    setForm(EMPTY_FORM);
    setOpen(false);
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setForm(EMPTY_FORM);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger && !isEditMode && (
        <DialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Task</span>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description (optional)</Label>
            <Textarea
              id="task-desc"
              placeholder="Details, notes..."
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  v && setForm({ ...form, category: v as TaskCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  v && setForm({ ...form, priority: v as TaskPriority })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Difficulty + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) =>
                  v && setForm({ ...form, difficulty: v as TaskDifficulty })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (10 XP)</SelectItem>
                  <SelectItem value="medium">Medium (25 XP)</SelectItem>
                  <SelectItem value="hard">Hard (50 XP)</SelectItem>
                  <SelectItem value="epic">Epic (100 XP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-duration">Duration (min)</Label>
              <Input
                id="task-duration"
                type="number"
                placeholder="30"
                min={1}
                max={480}
                value={form.estimatedMinutes ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimatedMinutes: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Due time + Recurring */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="task-due">Due Time</Label>
              <Input
                id="task-due"
                type="time"
                value={form.dueTime ?? ""}
                onChange={(e) =>
                  setForm({ ...form, dueTime: e.target.value || undefined })
                }
              />
            </div>
            <div className="flex items-end space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) =>
                    setForm({ ...form, isRecurring: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border"
                />
                Recurring daily
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!form.title.trim()}>
              {isEditMode ? "Save Changes" : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
