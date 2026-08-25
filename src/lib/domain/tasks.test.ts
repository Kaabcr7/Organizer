import { describe, it, expect } from "vitest";
import { getCompletionPercentage, getEarnedXp, getNextTask, groupTasksByCategory } from "./tasks";
import type { Task } from "@/types/task";

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "test-1",
    title: "Test Task",
    category: "personal",
    priority: "normal",
    difficulty: "medium",
    xpReward: 25,
    completed: false,
    isRecurring: false,
    date: "2026-08-24",
    ...overrides,
  };
}

describe("getCompletionPercentage", () => {
  it("returns 0 for empty tasks", () => {
    expect(getCompletionPercentage([])).toBe(0);
  });

  it("returns 0 when no tasks completed", () => {
    const tasks = [createTask(), createTask({ id: "2" })];
    expect(getCompletionPercentage(tasks)).toBe(0);
  });

  it("returns 50 when half completed", () => {
    const tasks = [
      createTask({ completed: true }),
      createTask({ id: "2", completed: false }),
    ];
    expect(getCompletionPercentage(tasks)).toBe(50);
  });

  it("returns 100 when all completed", () => {
    const tasks = [
      createTask({ completed: true }),
      createTask({ id: "2", completed: true }),
    ];
    expect(getCompletionPercentage(tasks)).toBe(100);
  });

  it("rounds correctly", () => {
    const tasks = [
      createTask({ completed: true }),
      createTask({ id: "2" }),
      createTask({ id: "3" }),
    ];
    // 1/3 = 33.33...%
    expect(getCompletionPercentage(tasks)).toBe(33);
  });
});

describe("getEarnedXp", () => {
  it("returns 0 for no completed tasks", () => {
    const tasks = [createTask({ xpReward: 50 })];
    expect(getEarnedXp(tasks)).toBe(0);
  });

  it("sums XP from completed tasks only", () => {
    const tasks = [
      createTask({ completed: true, xpReward: 50 }),
      createTask({ id: "2", completed: false, xpReward: 25 }),
      createTask({ id: "3", completed: true, xpReward: 10 }),
    ];
    expect(getEarnedXp(tasks)).toBe(60);
  });
});

describe("getNextTask", () => {
  it("returns null for empty list", () => {
    expect(getNextTask([])).toBeNull();
  });

  it("returns null when all tasks completed", () => {
    const tasks = [createTask({ completed: true })];
    expect(getNextTask(tasks)).toBeNull();
  });

  it("returns highest priority incomplete task", () => {
    const tasks = [
      createTask({ id: "1", priority: "low" }),
      createTask({ id: "2", priority: "high" }),
      createTask({ id: "3", priority: "normal" }),
    ];
    const next = getNextTask(tasks);
    expect(next?.id).toBe("2");
  });

  it("returns critical over high", () => {
    const tasks = [
      createTask({ id: "1", priority: "high" }),
      createTask({ id: "2", priority: "critical" }),
    ];
    const next = getNextTask(tasks);
    expect(next?.id).toBe("2");
  });
});

describe("groupTasksByCategory", () => {
  it("groups tasks correctly", () => {
    const tasks = [
      createTask({ id: "1", category: "college" }),
      createTask({ id: "2", category: "dsa" }),
      createTask({ id: "3", category: "college" }),
    ];
    const grouped = groupTasksByCategory(tasks);
    expect(grouped["college"]).toHaveLength(2);
    expect(grouped["dsa"]).toHaveLength(1);
  });

  it("returns empty object for no tasks", () => {
    expect(groupTasksByCategory([])).toEqual({});
  });
});
