"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from "react";

import type { AppState, AppAction, NewTaskInput } from "./types";
import type { Task } from "@/types/task";
import type { ScheduleBlock } from "@/types/schedule";
import { appReducer } from "./reducer";
import { createInitialState } from "./initial-state";
import { getTodayDate, getIsoWeekday } from "@/lib/domain/daily-state";
import { getCompletionPercentage } from "@/lib/domain/tasks";
import { getLevelProgress } from "@/lib/domain/xp";
import { LEVEL_XP_TABLE } from "@/lib/constants";
import { ApiError, parseWeekdays } from "@/lib/api/client";

import { useApiTasks } from "@/hooks/useApiTasks";
import { useApiProfile } from "@/hooks/useApiProfile";
import { useApiHistory } from "@/hooks/useApiHistory";
import { useApiAchievements } from "@/hooks/useApiAchievements";
import { useApiSchedule } from "@/hooks/useApiSchedule";

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  addTask: (task: NewTaskInput) => Promise<void>;
  editTask: (
    taskId: string,
    updates: Partial<AppState["tasks"][0]>
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  carryForwardTask: (taskId: string) => Promise<void>;

  dismissXpAnimation: (id: string) => void;
  dismissLevelUp: () => void;

  isLoading: boolean;
  apiError: ApiError | null;
  clearApiError: () => void;

  completionPercentage: number;
  levelProgress: number;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Derive the XP thresholds bracketing a level. At the top of the table the
 * next-level threshold equals the current one, which `getLevelProgress`
 * reports as 100%.
 */
function xpThresholdsForLevel(level: number): {
  xpForCurrentLevel: number;
  xpForNextLevel: number;
} {
  const lastThreshold = LEVEL_XP_TABLE[LEVEL_XP_TABLE.length - 1];
  return {
    xpForCurrentLevel: LEVEL_XP_TABLE[level] ?? 0,
    xpForNextLevel: LEVEL_XP_TABLE[level + 1] ?? lastThreshold,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, createInitialState());

  const [isInitialized, setIsInitialized] = useState(false);

  // Lets async callbacks and event listeners read the latest state without
  // taking it as an effect dependency.
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const taskApi = useApiTasks();
  const profileApi = useApiProfile();
  const historyApi = useApiHistory();
  const achievementsApi = useApiAchievements();
  const scheduleApi = useApiSchedule();

  const isLoading =
    taskApi.loading ||
    profileApi.loading ||
    historyApi.loading ||
    achievementsApi.loading ||
    scheduleApi.loading;

  const apiError =
    taskApi.error ||
    profileApi.error ||
    historyApi.error ||
    achievementsApi.error ||
    scheduleApi.error;

  const clearApiError = useCallback(() => {
    taskApi.clearError();
    profileApi.clearError();
    historyApi.clearError();
    achievementsApi.clearError();
    scheduleApi.clearError();
  }, [
    taskApi.clearError,
    profileApi.clearError,
    historyApi.clearError,
    achievementsApi.clearError,
    scheduleApi.clearError,
  ]);

  /*
   * Initial API load.
   *
   * The HYDRATE payload is built from `stateRef.current` rather than the
   * `state` captured at render time, so an update that landed while the
   * request was in flight is not thrown away.
   */
  useEffect(() => {
    if (isInitialized) return;

    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const today = getTodayDate();

        const [tasks] = await Promise.all([
          taskApi.getTodaysTasks(today),
          // The schedule has no auto-fetch of its own; kick it off here and
          // let the derive effect below fold it into state.
          scheduleApi.fetchSchedule().catch((error) => {
            console.error("Failed to load schedule:", error);
            return [];
          }),
        ]);

        if (cancelled) return;

        dispatch({
          type: "HYDRATE",
          state: {
            ...stateRef.current,
            tasks,
            today,
          },
        });
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [isInitialized, taskApi.getTodaysTasks, scheduleApi.fetchSchedule]);

  /*
   * Sync profile from API.
   *
   * The API client converts snake_case database fields into the camelCase
   * shape used by the frontend.
   */
  useEffect(() => {
    if (!profileApi.profile || !isInitialized) return;

    const p = profileApi.profile;
    const currentState = stateRef.current;
    const currentStats = currentState.stats;

    const totalXp = p.totalXp ?? currentStats.totalXp;
    const level = p.level ?? currentStats.level;
    const { xpForCurrentLevel, xpForNextLevel } = xpThresholdsForLevel(level);

    const newStats = {
      ...currentStats,
      totalXp,
      level,
      xpForCurrentLevel,
      xpForNextLevel,
      // Derived from today's task list by the reducer, not from the profile.
      tasksCompletedToday: currentStats.tasksCompletedToday,
      tasksCompletedTotal:
        p.tasksCompletedTotal ?? currentStats.tasksCompletedTotal,
      currentStreak: p.currentStreak ?? currentStats.currentStreak,
      longestStreak: p.longestStreak ?? currentStats.longestStreak,
    };

    // The XP thresholds are included so a stale pair still gets corrected
    // even when the level itself is unchanged.
    const statsChanged =
      currentStats.totalXp !== newStats.totalXp ||
      currentStats.level !== newStats.level ||
      currentStats.xpForCurrentLevel !== newStats.xpForCurrentLevel ||
      currentStats.xpForNextLevel !== newStats.xpForNextLevel ||
      currentStats.tasksCompletedTotal !== newStats.tasksCompletedTotal ||
      currentStats.currentStreak !== newStats.currentStreak ||
      currentStats.longestStreak !== newStats.longestStreak;

    if (!statsChanged) return;

    dispatch({
      type: "HYDRATE",
      state: {
        ...currentState,
        stats: newStats,
      },
    });
  }, [profileApi.profile, isInitialized]);

  /*
   * Sync achievements.
   */
  useEffect(() => {
    if (!achievementsApi.achievements || !isInitialized) return;

    const newAchievements = achievementsApi.achievements;
    const currentState = stateRef.current;
    const currentAchievements = currentState.achievements;

    const achievementsChanged =
      currentAchievements.length !== newAchievements.length ||
      currentAchievements.some(
        (achievement, index) =>
          achievement.id !== newAchievements[index]?.id ||
          achievement.isUnlocked !== newAchievements[index]?.isUnlocked
      );

    if (!achievementsChanged) return;

    dispatch({
      type: "HYDRATE",
      state: {
        ...currentState,
        achievements: newAchievements,
      },
    });
  }, [achievementsApi.achievements, isInitialized]);

  /*
   * Fold the fetched schedule blocks into state.
   *
   * Blocks are stored as recurrence rules rather than per-day rows, so only
   * the active blocks that recur on today's weekday belong in the day view.
   * `recurrenceDays === null` means "every day".
   */
  useEffect(() => {
    if (!scheduleApi.schedule || !isInitialized) return;

    const currentState = stateRef.current;
    const isoWeekday = getIsoWeekday();

    const blocks: ScheduleBlock[] = scheduleApi.schedule
      .filter(
        (block) =>
          block.isActive !== false &&
          (block.recurrenceDays === null ||
            block.recurrenceDays === undefined ||
            block.recurrenceDays.includes(isoWeekday))
      )
      .map(({ id, title, type, startTime, endTime, isFixed }) => ({
        id,
        title,
        type,
        startTime,
        endTime,
        isFixed,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const teachingDays = parseWeekdays(profileApi.profile?.teachingDays);
    const isTeachingDay = teachingDays?.includes(isoWeekday) ?? false;

    const currentSchedule = currentState.schedule;
    const scheduleChanged =
      currentSchedule.date !== currentState.today ||
      currentSchedule.isTeachingDay !== isTeachingDay ||
      currentSchedule.blocks.length !== blocks.length ||
      currentSchedule.blocks.some(
        (block, index) =>
          block.id !== blocks[index]?.id ||
          block.startTime !== blocks[index]?.startTime ||
          block.endTime !== blocks[index]?.endTime ||
          block.title !== blocks[index]?.title
      );

    if (!scheduleChanged) return;

    dispatch({
      type: "HYDRATE",
      state: {
        ...currentState,
        schedule: {
          date: currentState.today,
          isTeachingDay,
          blocks,
        },
      },
    });
  }, [scheduleApi.schedule, profileApi.profile, isInitialized]);

  /*
   * Check for a day rollover and refresh today's tasks whenever the tab
   * becomes visible.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      const today = getTodayDate();

      // The tab may have been left open across midnight. Rolling over first
      // archives the previous day and clears its animations before the new
      // day's tasks arrive.
      if (today !== stateRef.current.today) {
        dispatch({ type: "ROLLOVER_DAY" });
      }

      taskApi
        .getTodaysTasks(today)
        .then((tasks) => {
          dispatch({
            type: "HYDRATE",
            state: {
              ...stateRef.current,
              tasks,
              today,
            },
          });
        })
        .catch((error) => {
          console.error("Failed to refresh today's tasks:", error);
        });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [taskApi.getTodaysTasks]);

  /*
   * Complete task.
   *
   * The reducer performs the optimistic UI update; the server remains the
   * authoritative source of XP, so the profile is refetched afterwards.
   */
  const completeTask = useCallback(
    async (taskId: string) => {
      const currentTask = stateRef.current.tasks.find(
        (task) => task.id === taskId
      );

      if (!currentTask || currentTask.completed) return;

      const idempotencyKey = `complete-${taskId}-${Date.now()}`;

      dispatch({ type: "COMPLETE_TASK", taskId });

      try {
        const result = await taskApi.completeTask(taskId, idempotencyKey);

        if (result && result.new_total_xp !== undefined) {
          await profileApi.fetchProfile();
        }
      } catch (error) {
        console.error("Failed to complete task:", error);

        // Roll back the optimistic completion.
        dispatch({ type: "UNCOMPLETE_TASK", taskId });

        throw error;
      }
    },
    [taskApi.completeTask, profileApi.fetchProfile]
  );

  /*
   * Undo task completion.
   */
  const uncompleteTask = useCallback(
    async (taskId: string) => {
      const currentTask = stateRef.current.tasks.find(
        (task) => task.id === taskId
      );

      if (!currentTask || !currentTask.completed) return;

      dispatch({ type: "UNCOMPLETE_TASK", taskId });

      try {
        const result = await taskApi.undoCompleteTask(taskId);

        if (result && result.new_total_xp !== undefined) {
          await profileApi.fetchProfile();
        }
      } catch (error) {
        console.error("Failed to undo task:", error);

        dispatch({ type: "COMPLETE_TASK", taskId });

        throw error;
      }
    },
    [taskApi.undoCompleteTask, profileApi.fetchProfile]
  );

  /*
   * Create task.
   */
  const addTask = useCallback(
    async (task: NewTaskInput) => {
      const xpReward = (() => {
        switch (task.difficulty) {
          case "easy":
            return 10;
          case "medium":
            return 25;
          case "hard":
            return 50;
          case "epic":
            return 100;
          default:
            return 25;
        }
      })();

      const today = stateRef.current.today;
      const tempId = `temp-${Date.now()}`;

      const tempTask: Task = {
        ...task,
        id: tempId,
        xpReward,
        completed: false,
        date: today,
        isRecurring: task.isRecurring,
      };

      dispatch({ type: "ADD_TASK", task: tempTask });

      try {
        const created = await taskApi.createTask({
          ...task,
          date: today,
          xpReward,
        });

        dispatch({
          type: "REPLACE_TASK",
          oldId: tempId,
          newTask: created,
        });
      } catch (error) {
        console.error("Failed to create task:", error);

        // Drop the optimistic task. Reloading from the server would be more
        // thorough, but it can fail too and would mask the original error.
        dispatch({ type: "DELETE_TASK", taskId: tempId });

        throw error;
      }
    },
    [taskApi.createTask]
  );

  /*
   * Edit task.
   */
  const editTask = useCallback(
    async (taskId: string, updates: Partial<AppState["tasks"][0]>) => {
      const originalTasks = stateRef.current.tasks;

      dispatch({ type: "EDIT_TASK", taskId, updates });

      try {
        await taskApi.updateTask(taskId, updates);
      } catch (error) {
        console.error("Failed to edit task:", error);

        // Restore the pre-edit list, preserving order.
        dispatch({
          type: "HYDRATE",
          state: {
            ...stateRef.current,
            tasks: originalTasks,
          },
        });

        throw error;
      }
    },
    [taskApi.updateTask]
  );

  /*
   * Delete task.
   */
  const deleteTask = useCallback(
    async (taskId: string) => {
      const originalTasks = stateRef.current.tasks;

      dispatch({ type: "DELETE_TASK", taskId });

      try {
        await taskApi.deleteTask(taskId);
      } catch (error) {
        console.error("Failed to delete task:", error);

        // Restoring the whole list keeps the task at its original position
        // and avoids ADD_TASK re-registering a recurring template twice.
        dispatch({
          type: "HYDRATE",
          state: {
            ...stateRef.current,
            tasks: originalTasks,
          },
        });

        throw error;
      }
    },
    [taskApi.deleteTask]
  );

  /*
   * Carry task forward.
   */
  const carryForwardTask = useCallback(
    async (taskId: string) => {
      try {
        const carriedTask = await taskApi.carryForwardTask(
          taskId,
          stateRef.current.today
        );

        dispatch({ type: "ADD_TASK", task: carriedTask });
      } catch (error) {
        console.error("Failed to carry forward task:", error);

        throw error;
      }
    },
    [taskApi.carryForwardTask]
  );

  const dismissXpAnimation = useCallback((id: string) => {
    dispatch({ type: "DISMISS_XP_ANIMATION", animationId: id });
  }, []);

  const dismissLevelUp = useCallback(() => {
    dispatch({ type: "DISMISS_LEVEL_UP" });
  }, []);

  const completionPercentage = getCompletionPercentage(state.tasks);
  const levelProgress = getLevelProgress(state.stats);

  const value: AppContextValue = {
    state,
    dispatch,

    completeTask,
    uncompleteTask,
    addTask,
    editTask,
    deleteTask,
    carryForwardTask,

    dismissXpAnimation,
    dismissLevelUp,

    isLoading,
    apiError,
    clearApiError,

    completionPercentage,
    levelProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
}
