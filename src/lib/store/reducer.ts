import type { AppState, AppAction } from "./types";
import { LEVEL_XP_TABLE } from "@/lib/constants";
import { getLevelFromXp } from "@/lib/domain/xp";
import { getCompletionPercentage, getEarnedXp } from "@/lib/domain/tasks";
import { getTodayDate, generateRecurringTasks } from "@/lib/domain/daily-state";
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

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
      const xpReward = action.task.isRecurring
        ? calculateXpReward(action.task.difficulty)
        : calculateXpReward(action.task.difficulty);

      const newTask: Task = {
        id: generateId(),
        title: action.task.title,
        description: action.task.description,
        category: action.task.category,
        priority: action.task.priority,
        difficulty: action.task.difficulty,
        xpReward,
        estimatedMinutes: action.task.estimatedMinutes,
        dueTime: action.task.dueTime,
        completed: false,
        isRecurring: action.task.isRecurring,
        date: state.today,
      };

      const newTasks = [...state.tasks, newTask];

      // Also add to recurring templates if recurring
      const newTemplates = action.task.isRecurring
        ? [...state.recurringTemplates, newTask]
        : state.recurringTemplates;

      return recalcStats({
        ...state,
        tasks: newTasks,
        recurringTemplates: newTemplates,
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
      const historicalDay = state.history[action.fromDate];
      if (!historicalDay) return state;

      const taskToCarry = historicalDay.tasks.find(
        (t) => t.id === action.taskId
      );
      if (!taskToCarry || taskToCarry.completed) return state;

      const carriedTask: Task = {
        ...taskToCarry,
        id: `${taskToCarry.id}-carried-${state.today}`,
        date: state.today,
        completed: false,
        completedAt: undefined,
      };

      return recalcStats({
        ...state,
        tasks: [...state.tasks, carriedTask],
      });
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

      // Generate recurring tasks for new day
      const recurringTasks = generateRecurringTasks(
        state.recurringTemplates,
        newDate
      );

      // Update streak: if yesterday was completed (>=1 task), streak continues
      const yesterdayCompletion = getCompletionPercentage(state.tasks);
      const newStreak =
        yesterdayCompletion > 0
          ? state.stats.currentStreak + 1
          : 0;

      return {
        ...state,
        today: newDate,
        tasks: recurringTasks,
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
      return action.state;
    }

    default:
      return state;
  }
}
