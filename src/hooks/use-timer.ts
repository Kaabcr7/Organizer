"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "completed";

interface TimerState {
  status: TimerStatus;
  totalSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
}

interface UseTimerReturn extends TimerState {
  start: (durationMinutes: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  complete: () => void;
  progressPercent: number;
}

export function useTimer(): UseTimerReturn {
  const [state, setState] = useState<TimerState>({
    status: "idle",
    totalSeconds: 0,
    remainingSeconds: 0,
    elapsedSeconds: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Handle visibility change — recalculate elapsed when tab regains focus
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && state.status === "running") {
        const elapsed = pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, state.totalSeconds - elapsed);
        setState((prev) => ({
          ...prev,
          elapsedSeconds: elapsed,
          remainingSeconds: remaining,
          status: remaining <= 0 ? "completed" : "running",
        }));
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.status, state.totalSeconds]);

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "running") return prev;
      const elapsed = pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, prev.totalSeconds - elapsed);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return { ...prev, remainingSeconds: 0, elapsedSeconds: prev.totalSeconds, status: "completed" };
      }
      return { ...prev, remainingSeconds: remaining, elapsedSeconds: elapsed };
    });
  }, []);

  const start = useCallback(
    (durationMinutes: number) => {
      const totalSeconds = durationMinutes * 60;
      startTimeRef.current = Date.now();
      pausedElapsedRef.current = 0;
      setState({
        status: "running",
        totalSeconds,
        remainingSeconds: totalSeconds,
        elapsedSeconds: 0,
      });
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, 1000);
    },
    [tick]
  );

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    pausedElapsedRef.current = pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
    setState((prev) => ({ ...prev, status: "paused" }));
  }, []);

  const resume = useCallback(() => {
    startTimeRef.current = Date.now();
    setState((prev) => ({ ...prev, status: "running" }));
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    pausedElapsedRef.current = 0;
    setState({ status: "idle", totalSeconds: 0, remainingSeconds: 0, elapsedSeconds: 0 });
  }, []);

  const complete = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState((prev) => ({ ...prev, status: "completed" }));
  }, []);

  const progressPercent =
    state.totalSeconds > 0
      ? Math.round((state.elapsedSeconds / state.totalSeconds) * 100)
      : 0;

  return { ...state, start, pause, resume, reset, complete, progressPercent };
}
