"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AppState, AppAction, NewTaskInput } from "./types";
import { appReducer } from "./reducer";
import { createInitialState } from "./initial-state";
import { getTodayDate } from "@/lib/domain/daily-state";
import { getCompletionPercentage } from "@/lib/domain/tasks";
import { getLevelProgress } from "@/lib/domain/xp";

const STORAGE_KEY = "organizer-state";

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience actions
  completeTask: (taskId: string) => void;
  uncompleteTask: (taskId: string) => void;
  addTask: (task: NewTaskInput) => void;
  editTask: (taskId: string, updates: Partial<AppState["tasks"][0]>) => void;
  deleteTask: (taskId: string) => void;
  dismissXpAnimation: (id: string) => void;
  dismissLevelUp: () => void;
  // Derived values
  completionPercentage: number;
  levelProgress: number;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AppState;
    // Validate it has the expected shape
    if (!parsed.today || !Array.isArray(parsed.tasks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, null, () => {
    const stored = loadState();
    if (stored) {
      // Check if day has changed
      if (stored.today !== getTodayDate()) {
        return appReducer(stored, { type: "ROLLOVER_DAY" });
      }
      return stored;
    }
    return createInitialState();
  });

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Check for day rollover on visibility change
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        if (state.today !== getTodayDate()) {
          dispatch({ type: "ROLLOVER_DAY" });
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.today]);

  // Convenience actions
  const completeTask = useCallback(
    (taskId: string) => dispatch({ type: "COMPLETE_TASK", taskId }),
    []
  );
  const uncompleteTask = useCallback(
    (taskId: string) => dispatch({ type: "UNCOMPLETE_TASK", taskId }),
    []
  );
  const addTask = useCallback(
    (task: NewTaskInput) => dispatch({ type: "ADD_TASK", task }),
    []
  );
  const editTask = useCallback(
    (taskId: string, updates: Partial<AppState["tasks"][0]>) =>
      dispatch({ type: "EDIT_TASK", taskId, updates }),
    []
  );
  const deleteTask = useCallback(
    (taskId: string) => dispatch({ type: "DELETE_TASK", taskId }),
    []
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
    dismissXpAnimation,
    dismissLevelUp,
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
