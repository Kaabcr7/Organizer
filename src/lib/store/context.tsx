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
import { appReducer } from "./reducer";
import { createInitialState } from "./initial-state";
import { getTodayDate } from "@/lib/domain/daily-state";
import { getCompletionPercentage } from "@/lib/domain/tasks";
import { getLevelProgress } from "@/lib/domain/xp";
import { useApiTasks } from "@/hooks/useApiTasks";
import { useApiProfile } from "@/hooks/useApiProfile";
import { useApiHistory } from "@/hooks/useApiHistory";
import { useApiAchievements } from "@/hooks/useApiAchievements";
import { ApiError } from "@/lib/api/client";

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience actions - now call API
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  addTask: (task: NewTaskInput) => Promise<void>;
  editTask: (taskId: string, updates: Partial<AppState["tasks"][0]>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  carryForwardTask: (taskId: string) => Promise<void>;
  dismissXpAnimation: (id: string) => void;
  dismissLevelUp: () => void;
  // Loading and error states
  isLoading: boolean;
  apiError: ApiError | null;
  clearApiError: () => void;
  // Derived values
  completionPercentage: number;
  levelProgress: number;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize with empty state
  const [state, dispatch] = useReducer(appReducer, createInitialState());
  const [isInitialized, setIsInitialized] = useState(false);

  // Ref to track latest state for event listeners that can't have state in deps
  const stateRef = useRef(state);
  
  // Keep ref in sync with state (using useLayoutEffect to avoid render issues)
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  // API hooks
  const taskApi = useApiTasks();
  const profileApi = useApiProfile();
  const historyApi = useApiHistory();
  const achievementsApi = useApiAchievements();
  
  // Combined loading/error states
  const isLoading = taskApi.loading || profileApi.loading || historyApi.loading || achievementsApi.loading;
  const apiError = taskApi.error || profileApi.error || historyApi.error || achievementsApi.error;
  
  const clearApiError = useCallback(() => {
    taskApi.clearError();
    profileApi.clearError();
    historyApi.clearError();
    achievementsApi.clearError();
  }, [taskApi, profileApi, historyApi, achievementsApi]);

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const today = getTodayDate();
        
        // Load today's tasks from API
        const tasks = await taskApi.getTodaysTasks(today);
        dispatch({ type: "HYDRATE", state: { ...state, tasks, today } });
        
        // Profile will auto-fetch via useApiProfile
        // Achievements will auto-fetch via useApiAchievements
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        // Still mark as initialized to show error UI
        setIsInitialized(true);
      }
    };
    
    if (!isInitialized) {
      loadInitialData();
    }
  }, [isInitialized, taskApi]);

  // Update state when profile data loads (idempotent - only if values changed)
  useEffect(() => {
    if (!profileApi.profile || !isInitialized) return;

    const p = profileApi.profile;
    const newStats = {
      totalXp: p.totalXp || 0,
      level: p.level || 1,
      tasksCompletedToday: p.tasksCompletedToday || 0,
      tasksCompletedTotal: p.tasksCompletedTotal || 0,
      currentStreak: p.currentStreak || 0,
      longestStreak: p.longestStreak || 0,
      xpForCurrentLevel: p.xpForCurrentLevel || 0,
      xpForNextLevel: p.xpForNextLevel || 0,
    };

    // Only dispatch if stats actually changed
    const currentStats = state.stats;
    const statsChanged =
      currentStats.totalXp !== newStats.totalXp ||
      currentStats.level !== newStats.level ||
      currentStats.tasksCompletedToday !== newStats.tasksCompletedToday ||
      currentStats.tasksCompletedTotal !== newStats.tasksCompletedTotal ||
      currentStats.currentStreak !== newStats.currentStreak ||
      currentStats.longestStreak !== newStats.longestStreak ||
      currentStats.xpForCurrentLevel !== newStats.xpForCurrentLevel ||
      currentStats.xpForNextLevel !== newStats.xpForNextLevel;

    if (statsChanged) {
      dispatch({
        type: "HYDRATE",
        state: {
          ...state,
          stats: newStats,
        },
      });
    }
  }, [profileApi.profile, isInitialized]);

  // Update state when achievements load (idempotent - only if values changed)
  useEffect(() => {
    if (!achievementsApi.achievements || !isInitialized) return;

    const newAchievements = achievementsApi.achievements;
    const currentAchievements = state.achievements;

    // Only dispatch if achievements actually changed (compare by reference and length)
    const achievementsChanged =
      currentAchievements.length !== newAchievements.length ||
      currentAchievements.some((a, i) => a.id !== newAchievements[i]?.id);

    if (achievementsChanged) {
      dispatch({
        type: "HYDRATE",
        state: {
          ...state,
          achievements: newAchievements,
        },
      });
    }
  }, [achievementsApi.achievements, isInitialized]);

  // Check for day rollover on visibility change
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        // Use ref to get latest state without adding it to deps
        const currentState = stateRef.current;
        const today = getTodayDate();
        taskApi.getTodaysTasks(today).then((tasks) => {
          dispatch({ type: "HYDRATE", state: { ...currentState, tasks, today } });
        }).catch(console.error);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [taskApi]);

  // API-driven actions with optimistic updates
  const completeTask = useCallback(
    async (taskId: string) => {
      const idempotencyKey = `complete-${taskId}-${Date.now()}`;
      
      // Optimistic update
      dispatch({ type: "COMPLETE_TASK", taskId });
      
      try {
        // Call API
        const result = await taskApi.completeTask(taskId, idempotencyKey);
        
        // Sync profile data
        if (result.new_total_xp !== undefined) {
          await profileApi.fetchProfile();
        }
      } catch (error) {
        // Rollback on error
        console.error("Failed to complete task:", error);
        dispatch({ type: "UNCOMPLETE_TASK", taskId });
        throw error;
      }
    },
    [taskApi, profileApi]
  );

  const uncompleteTask = useCallback(
    async (taskId: string) => {
      // Optimistic update
      dispatch({ type: "UNCOMPLETE_TASK", taskId });
      
      try {
        // Call API
        const result = await taskApi.undoCompleteTask(taskId);
        
        // Sync profile data
        if (result.new_total_xp !== undefined) {
          await profileApi.fetchProfile();
        }
      } catch (error) {
        // Rollback on error
        console.error("Failed to undo task:", error);
        dispatch({ type: "COMPLETE_TASK", taskId });
        throw error;
      }
    },
    [taskApi, profileApi]
  );

  const addTask = useCallback(
    async (task: NewTaskInput) => {
      const xpReward = (() => {
        switch (task.difficulty) {
          case "easy": return 10;
          case "medium": return 25;
          case "hard": return 50;
          case "epic": return 100;
          default: return 25;
        }
      })();

      // Optimistic update with temp ID
      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = {
        ...task,
        id: tempId,
        xpReward,
        completed: false,
        date: state.today,
        isRecurring: task.isRecurring,
      };
      dispatch({
        type: "ADD_TASK",
        task: tempTask,
      });

      try {
        // Call API
        const created = await taskApi.createTask({
          ...task,
          date: state.today,
          xpReward,
        });
        
        // Replace optimistic task (temp ID) with real task from API (UUID)
        dispatch({
          type: "REPLACE_TASK",
          oldId: tempId,
          newTask: created,
        });
      } catch (error) {
        // Rollback on error - reload from server
        console.error("Failed to create task:", error);
        const tasks = await taskApi.getTodaysTasks(state.today);
        dispatch({ type: "HYDRATE", state: { ...state, tasks } });
        throw error;
      }
    },
    [taskApi, state]
  );

  const editTask = useCallback(
    async (taskId: string, updates: Partial<AppState["tasks"][0]>) => {
      // Optimistic update
      dispatch({ type: "EDIT_TASK", taskId, updates });
      
      try {
        // Call API
        await taskApi.updateTask(taskId, updates);
      } catch (error) {
        // Rollback on error - reload from server
        console.error("Failed to edit task:", error);
        const tasks = await taskApi.getTodaysTasks(state.today);
        dispatch({ type: "HYDRATE", state: { ...state, tasks } });
        throw error;
      }
    },
    [taskApi, state]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      // Store original for rollback
      const originalTask = state.tasks.find(t => t.id === taskId);
      
      // Optimistic update
      dispatch({ type: "DELETE_TASK", taskId });
      
      try {
        // Call API
        await taskApi.deleteTask(taskId);
      } catch (error) {
        // Rollback on error
        console.error("Failed to delete task:", error);
        if (originalTask) {
          dispatch({ type: "ADD_TASK", task: originalTask });
        }
        throw error;
      }
    },
    [taskApi, state.tasks]
  );

  const carryForwardTask = useCallback(
    async (taskId: string) => {
      try {
        // Call API to carry forward task
        const carriedTask = await taskApi.carryForwardTask(taskId, state.today);
        
        // Add the carried task to current day's tasks
        dispatch({ type: "ADD_TASK", task: carriedTask });
      } catch (error) {
        console.error("Failed to carry forward task:", error);
        throw error;
      }
    },
    [taskApi, state.today]
  );

  const dismissXpAnimation = useCallback(
    (id: string) => dispatch({ type: "DISMISS_XP_ANIMATION", animationId: id }),
    []
  );

  const dismissLevelUp = useCallback(
    () => dispatch({ type: "DISMISS_LEVEL_UP" }),
    []
  );

  // Derived values
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
