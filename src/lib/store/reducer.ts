import type { AppState, AppAction } from "./types";
import { LEVEL_XP_TABLE } from "@/lib/constants";
import { getLevelFromXp } from "@/lib/domain/xp";
import { getCompletionPercentage, getEarnedXp } from "@/lib/domain/tasks";
import { getTodayDate } from "@/lib/domain/daily-state";
import type { Task } from "@/types/task";

function calculateXpReward(difficulty: string): number {
  switch (difficulty) {
    case "easy": return 10;
    case "medium": return 25;
    case "hard": return 50;
    case "epic": return 100;
    default: return 25;
  }
}

function recalcStats(state: AppState): AppState {
  const todayTasks = state.tasks;
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalXpEarned = getEarnedXp(todayTasks);
  const completionPercentage = getCompletionPercentage(todayTasks);

  return {
    ...state,
    stats: {
      ...state.stats,
      tasksCompletedToday: completedToday,
    },
    // Update history for today
    history: {
      ...state.history,
      [state.today]: {
        date: state.today,
        tasks: todayTasks,
        totalXpEarned,
        completionPercentage,
      },
    },
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "COMPLETE_TASK": {
      const taskIndex = state.tasks.findIndex((t) => t.id === action.taskId);
      if (taskIndex === -1 || state.tasks[taskIndex].completed) return state;

      const task = state.tasks[taskIndex];
      const completedTask: Task = {
        ...task,
        completed: true,
        completedAt: new Date().toISOString(),
      };

      const updatedTasks = state.tasks.map((t) =>
        t.id === action.taskId ? completedTask : t
      );

      // XP calculation
      const newTotalXp = state.stats.totalXp + task.xpReward;
      const previousLevel = state.stats.level;
      const newLevel = getLevelFromXp(newTotalXp);
      const xpForCurrentLevel = LEVEL_XP_TABLE[newLevel] ?? 0;
      const xpForNextLevel = LEVEL_XP_TABLE[newLevel + 1] ?? LEVEL_XP_TABLE[LEVEL_XP_TABLE.length - 1];

      // Level-up detection
      const levelUpEvent = newLevel > previousLevel
        ? { previousLevel, newLevel, timestamp: Date.now() }
        : state.levelUpEvent;

      // XP animation
      const xpAnimation = {
        id: `xp-${Date.now()}`,
        amount: task.xpReward,
        taskTitle: task.title,
        timestamp: Date.now(),
      };

      const newState: AppState = {
        ...state,
        tasks: updatedTasks,
        stats: {
          ...state.stats,
          totalXp: newTotalXp,
          level: newLevel,
          xpForCurrentLevel,
          xpForNextLevel,
          tasksCompletedToday: state.stats.tasksCompletedToday + 1,
          tasksCompletedTotal: state.stats.tasksCompletedTotal + 1,
        },
        xpAnimations: [...state.xpAnimations, xpAnimation],
        levelUpEvent,
      };

      return recalcStats(newState);
    }

    case "UNCOMPLETE_TASK": {
      const taskIndex = state.tasks.findIndex((t) => t.id === action.taskId);
      if (taskIndex === -1 || !state.tasks[taskIndex].completed) return state;

      const task = state.tasks[taskIndex];
      const updatedTasks = state.tasks.map((t) =>
        t.id === action.taskId
          ? { ...t, completed: false, completedAt: undefined }
          : t
      );

      // Reverse XP
      const newTotalXp = Math.max(0, state.stats.totalXp - task.xpReward);
      const newLevel = getLevelFromXp(newTotalXp);
      const xpForCurrentLevel = LEVEL_XP_TABLE[newLevel] ?? 0;
      const xpForNextLevel = LEVEL_XP_TABLE[newLevel + 1] ?? LEVEL_XP_TABLE[LEVEL_XP_TABLE.length - 1];

      const newState: AppState = {
        ...state,
        tasks: updatedTasks,
        stats: {
          ...state.stats,
          totalXp: newTotalXp,
          level: newLevel,
          xpForCurrentLevel,
          xpForNextLevel,
          tasksCompletedToday: Math.max(0, state.stats.tasksCompletedToday - 1),
          tasksCompletedTotal: Math.max(0, state.stats.tasksCompletedTotal - 1),
        },
      };

      return recalcStats(newState);
    }

    case "ADD_TASK": {
      // Task already has an ID (temp ID from optimistic update)
      const newTask: Task = action.task;

      const newTasks = [...state.tasks, newTask];

      // Also add to recurring templates if recurring
      const newTemplates = newTask.isRecurring
        ? [...state.recurringTemplates, newTask]
        : state.recurringTemplates;

      return recalcStats({
        ...state,
        tasks: newTasks,
        recurringTemplates: newTemplates,
      });
    }

    case "REPLACE_TASK": {
      // Replace optimistic task (with temp ID) with real task from API (with UUID)
      const updatedTasks = state.tasks.map((t) =>
        t.id === action.oldId ? action.newTask : t
      );
      const updatedTemplates = state.recurringTemplates.map((t) =>
        t.id === action.oldId ? action.newTask : t
      );
      return recalcStats({
        ...state,
        tasks: updatedTasks,
        recurringTemplates: updatedTemplates,
      });
    }

    case "EDIT_TASK": {
      const updatedTasks = state.tasks.map((t) =>
        t.id === action.taskId ? { ...t, ...action.updates } : t
      );
      return recalcStats({ ...state, tasks: updatedTasks });
    }

    case "DELETE_TASK": {
      const updatedTasks = state.tasks.filter((t) => t.id !== action.taskId);
      return recalcStats({ ...state, tasks: updatedTasks });
    }

    case "DISMISS_XP_ANIMATION": {
      return {
        ...state,
        xpAnimations: state.xpAnimations.filter(
          (a) => a.id !== action.animationId
        ),
      };
    }

    case "DISMISS_LEVEL_UP": {
      return { ...state, levelUpEvent: null };
    }

    case "CARRY_FORWARD_TASK": {
      // This action should not be dispatched directly - carry forward is done via API
      // which returns a task with a real UUID. This case is kept for backwards compatibility
      // but should not generate client-side IDs.
      const historicalDay = state.history[action.fromDate];
      if (!historicalDay) return state;

      const taskToCarry = historicalDay.tasks.find(
        (t) => t.id === action.taskId
      );
      if (!taskToCarry || taskToCarry.completed) return state;

      // Return state unchanged - the API call will handle creating the task
      // and the context will replace via REPLACE_TASK or HYDRATE
      return state;
    }

    case "ROLLOVER_DAY": {
      const newDate = getTodayDate();
      if (newDate === state.today) return state;

      // Save current day to history
      const currentDayHistory = {
        date: state.today,
        tasks: state.tasks,
        totalXpEarned: getEarnedXp(state.tasks),
        completionPercentage: getCompletionPercentage(state.tasks),
      };

      // Update streak: if yesterday was completed (>=1 task), streak continues
      const yesterdayCompletion = getCompletionPercentage(state.tasks);
      const newStreak =
        yesterdayCompletion > 0
          ? state.stats.currentStreak + 1
          : 0;

      return {
        ...state,
        today: newDate,
        tasks: [], // Will be populated by API fetch (includes server-generated recurring tasks)
        history: {
          ...state.history,
          [state.today]: currentDayHistory,
        },
        stats: {
          ...state.stats,
          currentStreak: newStreak,
          longestStreak: Math.max(state.stats.longestStreak, newStreak),
          tasksCompletedToday: 0,
        },
        xpAnimations: [],
        levelUpEvent: null,
      };
    }

    case "HYDRATE": {
      // Recalculate so derived fields (today's completed count, today's
      // history entry) match the tasks that were just hydrated.
      return recalcStats(action.state);
    }

    default:
      return state;
  }
}
