import { describe, it, expect } from "vitest";
import { appReducer } from "./reducer";
import type { AppState } from "./types";
import type { Task } from "@/types/task";

function createMockState(overrides: Partial<AppState> = {}): AppState {
  const tasks: Task[] = [
    {
      id: "task-1",
      title: "Test Task",
      category: "personal",
      priority: "normal",
      difficulty: "medium",
      xpReward: 25,
      completed: false,
      isRecurring: false,
      date: "2026-08-24",
    },
    {
      id: "task-2",
      title: "Completed Task",
      category: "dsa",
      priority: "high",
      difficulty: "hard",
      xpReward: 50,
      completed: true,
      completedAt: "2026-08-24T10:00:00",
      isRecurring: false,
      date: "2026-08-24",
    },
  ];

  return {
    today: "2026-08-24",
    tasks,
    schedule: { date: "2026-08-24", isTeachingDay: false, blocks: [] },
    stats: {
      totalXp: 1300,
      level: 6,
      xpForCurrentLevel: 1300,
      xpForNextLevel: 1900,
      currentStreak: 5,
      longestStreak: 10,
      tasksCompletedToday: 1,
      tasksCompletedTotal: 50,
    },
    achievements: [],
    history: {},
    recurringTemplates: [],
    xpAnimations: [],
    levelUpEvent: null,
    ...overrides,
  };
}

describe("appReducer - COMPLETE_TASK", () => {
  it("marks task as completed and awards XP", () => {
    const state = createMockState();
    const newState = appReducer(state, { type: "COMPLETE_TASK", taskId: "task-1" });

    const task = newState.tasks.find((t) => t.id === "task-1");
    expect(task?.completed).toBe(true);
    expect(task?.completedAt).toBeDefined();
    expect(newState.stats.totalXp).toBe(1325); // 1300 + 25
    expect(newState.stats.tasksCompletedToday).toBe(2);
    expect(newState.stats.tasksCompletedTotal).toBe(51);
  });

  it("creates XP animation on completion", () => {
    const state = createMockState();
    const newState = appReducer(state, { type: "COMPLETE_TASK", taskId: "task-1" });

    expect(newState.xpAnimations).toHaveLength(1);
    expect(newState.xpAnimations[0].amount).toBe(25);
  });

  it("does not change state for already completed task", () => {
    const state = createMockState();
    const newState = appReducer(state, { type: "COMPLETE_TASK", taskId: "task-2" });
    expect(newState).toBe(state);
  });

  it("does not change state for non-existent task", () => {
    const state = createMockState();
    const newState = appReducer(state, { type: "COMPLETE_TASK", taskId: "nonexistent" });
    expect(newState).toBe(state);
  });

  it("triggers level-up when XP crosses threshold", () => {
    const state = createMockState({
      tasks: [
        {
          id: "task-1",
          title: "Epic Task",
          category: "projects",
          priority: "critical",
          difficulty: "epic",
          xpReward: 100,
          completed: false,
          isRecurring: false,
          date: "2026-08-24",
        },
      ],
      stats: {
        totalXp: 1850,
        level: 6,
        xpForCurrentLevel: 1300,
        xpForNextLevel: 1900,
        currentStreak: 5,
        longestStreak: 10,
        tasksCompletedToday: 0,
        tasksCompletedTotal: 50,
      },
    });

    const newState = appReducer(state, { type: "COMPLETE_TASK", taskId: "task-1" });
    expect(newState.stats.level).toBe(7);
    expect(newState.levelUpEvent).not.toBeNull();
    expect(newState.levelUpEvent?.newLevel).toBe(7);
    expect(newState.levelUpEvent?.previousLevel).toBe(6);
  });
});

describe("appReducer - UNCOMPLETE_TASK", () => {
  it("marks task as uncompleted and removes XP", () => {
    const state = createMockState();
    const newState = appReducer(state, { type: "UNCOMPLETE_TASK", taskId: "task-2" });

    const task = newState.tasks.find((t) => t.id === "task-2");
    expect(task?.completed).toBe(false);
    expect(task?.completedAt).toBeUndefined();
    expect(newState.stats.totalXp).toBe(1250); // 1300 - 50
  });
});

describe("appReducer - ADD_TASK", () => {
  it("adds a new task to the list", () => {
    const state = createMockState();
    const newState = appReducer(state, {
      type: "ADD_TASK",
      task: {
        title: "New Task",
        category: "dsa",
        priority: "high",
        difficulty: "hard",
        isRecurring: false,
      },
    });

    expect(newState.tasks).toHaveLength(3);
    const added = newState.tasks[2];
    expect(added.title).toBe("New Task");
    expect(added.category).toBe("dsa");
    expect(added.completed).toBe(false);
    expect(added.xpReward).toBe(50); // hard = 50
  });

  it("adds recurring task to templates", () => {
    const state = createMockState();
    const newState = appReducer(state, {
      type: "ADD_TASK",
      task: {
        title: "Daily DSA",
        category: "dsa",
        priority: "high",
        difficulty: "medium",
        isRecurring: true,
      },
    });

    expect(newState.recurringTemplates).toHaveLength(1);
    expect(newState.recurringTemplates[0].title).toBe("Daily DSA");
  });
});

describe("appReducer - DELETE_TASK", () => {
  it("removes task from list", () => {
    const state = createMockState();
    const newState = appReducer(state, { type: "DELETE_TASK", taskId: "task-1" });
    expect(newState.tasks).toHaveLength(1);
    expect(newState.tasks.find((t) => t.id === "task-1")).toBeUndefined();
  });
});

describe("appReducer - DISMISS_LEVEL_UP", () => {
  it("clears level up event", () => {
    const state = createMockState({
      levelUpEvent: { previousLevel: 5, newLevel: 6, timestamp: Date.now() },
    });
    const newState = appReducer(state, { type: "DISMISS_LEVEL_UP" });
    expect(newState.levelUpEvent).toBeNull();
  });
});

describe("appReducer - ROLLOVER_DAY", () => {
  it("preserves current day in history and generates recurring tasks", () => {
    const state = createMockState({
      today: "2026-08-23", // yesterday
      recurringTemplates: [
        {
          id: "recurring-1",
          title: "Daily DSA",
          category: "dsa",
          priority: "high",
          difficulty: "medium",
          xpReward: 25,
          completed: false,
          isRecurring: true,
          date: "2026-08-23",
        },
      ],
    });

    const newState = appReducer(state, { type: "ROLLOVER_DAY" });

    // History should contain the old day
    expect(newState.history["2026-08-23"]).toBeDefined();
    expect(newState.history["2026-08-23"].tasks).toHaveLength(2); // original tasks

    // New day should only have recurring tasks
    expect(newState.tasks).toHaveLength(1);
    expect(newState.tasks[0].title).toBe("Daily DSA");
    expect(newState.tasks[0].completed).toBe(false);

    // Stats updated
    expect(newState.stats.tasksCompletedToday).toBe(0);
  });
});


describe("appReducer - EDIT_TASK", () => {
  it("updates task fields without changing id or completion state", () => {
    const state = createMockState();
    const newState = appReducer(state, {
      type: "EDIT_TASK",
      taskId: "task-1",
      updates: {
        title: "Updated Title",
        category: "dsa",
        priority: "critical",
        difficulty: "epic",
        xpReward: 100,
        estimatedMinutes: 120,
      },
    });

    const task = newState.tasks.find((t) => t.id === "task-1");
    expect(task).toBeDefined();
    expect(task!.title).toBe("Updated Title");
    expect(task!.category).toBe("dsa");
    expect(task!.priority).toBe("critical");
    expect(task!.difficulty).toBe("epic");
    expect(task!.xpReward).toBe(100);
    expect(task!.estimatedMinutes).toBe(120);
    // Preserves original fields
    expect(task!.id).toBe("task-1");
    expect(task!.completed).toBe(false);
  });

  it("does not award XP when editing a completed task's xpReward", () => {
    const state = createMockState();
    const originalXp = state.stats.totalXp;

    const newState = appReducer(state, {
      type: "EDIT_TASK",
      taskId: "task-2", // completed task
      updates: {
        xpReward: 200,
      },
    });

    // XP should NOT change just from editing
    expect(newState.stats.totalXp).toBe(originalXp);
  });

  it("preserves completion state when editing other fields", () => {
    const state = createMockState();
    const newState = appReducer(state, {
      type: "EDIT_TASK",
      taskId: "task-2", // already completed
      updates: {
        title: "Renamed Completed Task",
        category: "ml-ai",
      },
    });

    const task = newState.tasks.find((t) => t.id === "task-2");
    expect(task!.completed).toBe(true);
    expect(task!.completedAt).toBeDefined();
    expect(task!.title).toBe("Renamed Completed Task");
  });
});

describe("appReducer - CARRY_FORWARD_TASK", () => {
  it("carries an incomplete task from history to today", () => {
    const state = createMockState({
      history: {
        "2026-08-23": {
          date: "2026-08-23",
          tasks: [
            {
              id: "old-task-1",
              title: "Unfinished Work",
              category: "projects",
              priority: "high",
              difficulty: "hard",
              xpReward: 50,
              completed: false,
              isRecurring: false,
              date: "2026-08-23",
            },
            {
              id: "old-task-2",
              title: "Done Task",
              category: "dsa",
              priority: "normal",
              difficulty: "medium",
              xpReward: 25,
              completed: true,
              completedAt: "2026-08-23T15:00:00",
              isRecurring: false,
              date: "2026-08-23",
            },
          ],
          totalXpEarned: 25,
          completionPercentage: 50,
        },
      },
    });

    const newState = appReducer(state, {
      type: "CARRY_FORWARD_TASK",
      taskId: "old-task-1",
      fromDate: "2026-08-23",
    });

    // Should add a new task to today
    expect(newState.tasks).toHaveLength(3); // 2 original + 1 carried
    const carried = newState.tasks.find((t) => t.title === "Unfinished Work");
    expect(carried).toBeDefined();
    expect(carried!.completed).toBe(false);
    expect(carried!.date).toBe(state.today);
  });

  it("does not carry forward a completed task", () => {
    const state = createMockState({
      history: {
        "2026-08-23": {
          date: "2026-08-23",
          tasks: [
            {
              id: "done-task",
              title: "Already Done",
              category: "dsa",
              priority: "normal",
              difficulty: "medium",
              xpReward: 25,
              completed: true,
              completedAt: "2026-08-23T10:00:00",
              isRecurring: false,
              date: "2026-08-23",
            },
          ],
          totalXpEarned: 25,
          completionPercentage: 100,
        },
      },
    });

    const newState = appReducer(state, {
      type: "CARRY_FORWARD_TASK",
      taskId: "done-task",
      fromDate: "2026-08-23",
    });

    // Should NOT add anything
    expect(newState.tasks).toHaveLength(2); // unchanged
  });

  it("does not carry from non-existent history date", () => {
    const state = createMockState();
    const newState = appReducer(state, {
      type: "CARRY_FORWARD_TASK",
      taskId: "some-task",
      fromDate: "2020-01-01",
    });

    expect(newState).toBe(state);
  });
});
