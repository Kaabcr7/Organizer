import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "./use-timer";

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.status).toBe("idle");
    expect(result.current.totalSeconds).toBe(0);
    expect(result.current.remainingSeconds).toBe(0);
  });

  it("starts timer with correct duration", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(5); // 5 minutes
    });

    expect(result.current.status).toBe("running");
    expect(result.current.totalSeconds).toBe(300);
    expect(result.current.remainingSeconds).toBe(300);
  });

  it("counts down correctly", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(1); // 1 minute
    });

    // Advance 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.remainingSeconds).toBe(50);
    expect(result.current.elapsedSeconds).toBe(10);
  });

  it("pauses the timer", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(1);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.status).toBe("paused");
    const remainingAtPause = result.current.remainingSeconds;

    // Advance time — remaining should not change
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remainingSeconds).toBe(remainingAtPause);
  });

  it("resumes the timer", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(1);
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      result.current.pause();
    });

    act(() => {
      result.current.resume();
    });

    expect(result.current.status).toBe("running");

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should have advanced further
    expect(result.current.remainingSeconds).toBe(50);
  });

  it("completes when time reaches 0", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(1); // 60 seconds
    });

    act(() => {
      vi.advanceTimersByTime(61000);
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.remainingSeconds).toBe(0);
  });

  it("resets to idle", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(5);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.totalSeconds).toBe(0);
    expect(result.current.remainingSeconds).toBe(0);
  });

  it("calculates progress percent", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(1); // 60s
    });

    act(() => {
      vi.advanceTimersByTime(30000); // 30s elapsed
    });

    expect(result.current.progressPercent).toBe(50);
  });
});
