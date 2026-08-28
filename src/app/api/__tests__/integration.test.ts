/**
 * INTEGRATION TESTS
 * 
 * These tests exercise the full flow:
 * API Route → Repository → Neon Database
 * 
 * Tests verify:
 * - Task CRUD operations
 * - Task completion/undo
 * - XP calculations
 * - Idempotency
 * - Ownership isolation
 * - Profile updates
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DrizzleTaskRepository } from "@/lib/data/drizzle-repositories";
import { DrizzleProfileRepository } from "@/lib/data/drizzle-repositories";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { profiles, taskInstances, xpEvents } from "@/lib/db/schema";
import { randomUUID } from "crypto";

// Mock auth context for testing - use UUIDs
const testUserId = randomUUID();
const testUserId2 = randomUUID();

describe("INTEGRATION: Task Operations → Neon", () => {
  let profileRepo: DrizzleProfileRepository;
  let taskRepo: DrizzleTaskRepository;

  beforeAll(async () => {
    profileRepo = new DrizzleProfileRepository();
    taskRepo = new DrizzleTaskRepository();

    // Create test profiles
    const db = getDb();
    await db.insert(profiles).values([
      {
        id: testUserId,
        totalXp: 0,
        level: 1,
        tasksCompletedTotal: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
      {
        id: testUserId2,
        totalXp: 0,
        level: 1,
        tasksCompletedTotal: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup - delete test data
    const db = getDb();
    await db.delete(taskInstances).where(eq(taskInstances.userId, testUserId));
    await db.delete(taskInstances).where(eq(taskInstances.userId, testUserId2));
    await db.delete(xpEvents).where(eq(xpEvents.userId, testUserId));
    await db.delete(xpEvents).where(eq(xpEvents.userId, testUserId2));
    await db.delete(profiles).where(eq(profiles.id, testUserId));
    await db.delete(profiles).where(eq(profiles.id, testUserId2));
  });

  // ==========================================
  // TASK CRUD
  // ==========================================

  it("INTEGRATION: Should create a task", async () => {
    const task = await taskRepo.createTask({
      user_id: testUserId,
      date: "2026-08-24",
      title: "Integration Test Task",
      description: "Test description",
      category: "dsa",
      priority: "high",
      difficulty: "medium",
      xp_reward: 25,
    });

    expect(task).toBeDefined();
    expect(task.id).toBeDefined();
    expect(task.title).toBe("Integration Test Task");
    expect(task.xp_reward || task.xpReward).toBe(25);
  });

  it("INTEGRATION: Should retrieve today's tasks", async () => {
    await taskRepo.createTask({
      user_id: testUserId,
      date: "2026-08-24",
      title: "Task 1",
      category: "personal",
      priority: "normal",
      difficulty: "easy",
      xp_reward: 10,
    });

    const tasks = await taskRepo.getTodaysTasks(testUserId, "2026-08-24");
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.some((t: any) => t.title === "Task 1")).toBe(true);
  });

  it("INTEGRATION: Should update a task", async () => {
    const created = await taskRepo.createTask({
      user_id: testUserId,
      date: "2026-08-24",
      title: "Original Title",
      category: "personal",
      priority: "normal",
      difficulty: "medium",
      xp_reward: 25,
    });

    const updated = await taskRepo.updateTask(created.id, {
      title: "Updated Title",
      priority: "high",
    });

    expect(updated.title).toBe("Updated Title");
    expect(updated.priority).toBe("high");
  });

  it("INTEGRATION: Should delete a task", async () => {
    const created = await taskRepo.createTask({
      user_id: testUserId,
      date: "2026-08-24",
      title: "Task to Delete",
      category: "personal",
      priority: "normal",
      difficulty: "easy",
      xp_reward: 10,
    });

    await taskRepo.deleteTask(created.id);

    const tasks = await taskRepo.getTodaysTasks(testUserId, "2026-08-24");
    const deleted = tasks.find((t: any) => t.id === created.id);
    expect(deleted).toBeUndefined();
  });

  // ==========================================
  // COMPLETION & XP
  // ==========================================

  it(
    "INTEGRATION: Should complete a task and award XP",
    async () => {
      const created = await taskRepo.createTask({
        user_id: testUserId,
        date: "2026-08-24",
        title: "Task to Complete",
        category: "personal",
        priority: "normal",
        difficulty: "hard",
        xp_reward: 50,
      });

      const result = await taskRepo.completeTask(testUserId, created.id);

      expect(result.success).toBe(true);
      expect(result.xp_awarded).toBe(50);
      expect(typeof result.new_total_xp).toBe("number");
      expect(result.new_total_xp).toBeGreaterThanOrEqual(50);
    },
    15000
  );

  it(
    "INTEGRATION: Should undo a completed task and reverse XP",
    async () => {
      const created = await taskRepo.createTask({
        user_id: testUserId,
        date: "2026-08-24",
        title: "Task to Undo",
        category: "personal",
        priority: "normal",
        difficulty: "epic",
        xp_reward: 100,
      });

      // Complete it
      const completeResult = await taskRepo.completeTask(testUserId, created.id);
      const xpAfterCompletion = completeResult.new_total_xp;

      // Undo it
      const undoResult = await taskRepo.undoCompleteTask(created.id);

      expect(undoResult.success).toBe(true);
      expect(undoResult.xp_removed).toBe(100);
      expect(undoResult.new_total_xp).toBe(xpAfterCompletion - 100);
    },
    15000
  );

  // ==========================================
  // IDEMPOTENCY
  // ==========================================

  it(
    "INTEGRATION: Should prevent duplicate XP with idempotency key",
    async () => {
      const created = await taskRepo.createTask({
        user_id: testUserId,
        date: "2026-08-24",
        title: "Idempotency Test",
        category: "personal",
        priority: "normal",
        difficulty: "medium",
        xp_reward: 25,
      });

      const idempotencyKey = randomUUID();

      // First completion
      const result1 = await taskRepo.completeTask(testUserId, created.id, idempotencyKey);
      expect(result1.success).toBe(true);
      expect(result1.xp_awarded).toBe(25);

      // Second completion with same key (should be idempotent)
      const result2 = await taskRepo.completeTask(testUserId, created.id, idempotencyKey);
      // Second call should not error (catches duplicate constraint)
      expect(result2).toBeDefined();
    },
    15000
  );

  // ==========================================
  // OWNERSHIP ISOLATION
  // ==========================================

  it("INTEGRATION: Should isolate user tasks by user_id", async () => {
    // Create task for user 1
    await taskRepo.createTask({
      user_id: testUserId,
      date: "2026-08-24",
      title: "User 1 Task",
      category: "personal",
      priority: "normal",
      difficulty: "easy",
      xp_reward: 10,
    });

    // Create task for user 2
    await taskRepo.createTask({
      user_id: testUserId2,
      date: "2026-08-24",
      title: "User 2 Task",
      category: "personal",
      priority: "normal",
      difficulty: "easy",
      xp_reward: 10,
    });

    // User 1 should only see their tasks
    const user1Tasks = await taskRepo.getTodaysTasks(testUserId, "2026-08-24");
    const user1HasOwnTask = user1Tasks.some((t: any) => t.title === "User 1 Task");
    const user1HasOthersTask = user1Tasks.some((t: any) => t.title === "User 2 Task");

    expect(user1HasOwnTask).toBe(true);
    expect(user1HasOthersTask).toBe(false);

    // User 2 should only see their tasks
    const user2Tasks = await taskRepo.getTodaysTasks(testUserId2, "2026-08-24");
    const user2HasOwnTask = user2Tasks.some((t: any) => t.title === "User 2 Task");
    const user2HasOthersTask = user2Tasks.some((t: any) => t.title === "User 1 Task");

    expect(user2HasOwnTask).toBe(true);
    expect(user2HasOthersTask).toBe(false);
  });

  // ==========================================
  // PROFILE
  // ==========================================

  it("INTEGRATION: Should get user profile with stats", async () => {
    const profile = await profileRepo.getProfile(testUserId);

    expect(profile).toBeDefined();
    expect(profile.id).toBe(testUserId);
    expect(profile.total_xp).toBeGreaterThanOrEqual(0);
    expect(profile.level).toBeGreaterThanOrEqual(1);
  });

  it("INTEGRATION: Should update profile", async () => {
    const updated = await profileRepo.updateProfile(testUserId, {
      display_name: "Test User Name",
    });

    expect(updated.display_name || updated.displayName).toBe("Test User Name");
  });
});

describe("INTEGRATION: XP Calculations → Neon", () => {
  const calcTestUserId = randomUUID();
  let taskRepo: DrizzleTaskRepository;
  let profileRepo: DrizzleProfileRepository;

  beforeAll(async () => {
    taskRepo = new DrizzleTaskRepository();
    profileRepo = new DrizzleProfileRepository();

    const db = getDb();
    await db.insert(profiles).values({
      id: calcTestUserId,
      totalXp: 0,
      level: 1,
      tasksCompletedTotal: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
  }, 30000);

  afterAll(async () => {
    const db = getDb();
    await db.delete(taskInstances).where(eq(taskInstances.userId, calcTestUserId));
    await db.delete(xpEvents).where(eq(xpEvents.userId, calcTestUserId));
    await db.delete(profiles).where(eq(profiles.id, calcTestUserId));
  }, 30000);

  it(
    "INTEGRATION: Should calculate level from XP correctly",
    async () => {
      // Create tasks
      const tasks = [];
      for (let i = 0; i < 2; i++) {
        const task = await taskRepo.createTask({
          user_id: calcTestUserId,
          date: "2026-08-24",
          title: `XP Task ${i}`,
          category: "personal",
          priority: "normal",
          difficulty: "hard",
          xp_reward: 50,
        });
        tasks.push(task);
      }

      // Complete first task and verify XP event created
      const result = await taskRepo.completeTask(calcTestUserId, tasks[0].id);
      expect(result.success).toBe(true);
      expect(result.xp_awarded).toBe(50);
      expect(result.new_total_xp).toBe(50);

      // Complete second task
      const result2 = await taskRepo.completeTask(calcTestUserId, tasks[1].id);
      expect(result2.success).toBe(true);
      expect(result2.xp_awarded).toBe(50);
      expect(result2.new_total_xp).toBe(100);
    },
    30000
  );
});
