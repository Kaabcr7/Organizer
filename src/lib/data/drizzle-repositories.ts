/**
 * Drizzle repository implementations for Neon PostgreSQL
 * Server-side database access using Drizzle ORM
 *
 * Connected to Neon, all queries execute real SQL
 * Type mapping handled via helper functions
 */

import type {
  IProfileRepository,
  ITaskRepository,
  IRecurringTemplateRepository,
  IScheduleRepository,
  IHistoryRepository,
  IAchievementRepository,
  CompleteTaskResult,
  UndoTaskResult,
} from "./repositories";
import { getDb } from "@/lib/db";
import {
  profiles,
  taskInstances,
  recurringTemplates,
  scheduleBlocks,
  xpEvents,
  dailySummaries,
  achievements,
  userAchievements,
} from "@/lib/db/schema";
import type {
  Profile as ProfileDrizzle,
  TaskInstance as TaskInstanceDrizzle,
  RecurringTemplate as RecurringTemplateDrizzle,
  ScheduleBlock as ScheduleBlockDrizzle,
  DailySummary as DailySummaryDrizzle,
  Achievement as AchievementDrizzle,
  UserAchievement as UserAchievementDrizzle,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { LEVEL_XP_TABLE } from "@/lib/constants";

/**
 * Calculate level from total XP
 */
function calculateLevelFromXp(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_XP_TABLE.length; i++) {
    if (totalXp >= LEVEL_XP_TABLE[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Profile Repository Implementation
 */
export class DrizzleProfileRepository implements IProfileRepository {
  async getProfile(userId: string): Promise<any> {
    const db = getDb();
    const result: ProfileDrizzle[] = await (db as any).select().from(profiles).where(eq(profiles.id, userId));
    if (!result || result.length === 0) return null;

    const p = result[0];
    return {
      id: p.id,
      display_name: p.displayName,
      avatar_url: p.avatarUrl,
      timezone: p.timezone,
      total_xp: p.totalXp,
      level: p.level,
      current_streak: p.currentStreak,
      longest_streak: p.longestStreak,
      tasks_completed_total: p.tasksCompletedTotal,
      teaching_days: p.teachingDays,
      college_start: p.collegeStart,
      college_end: p.collegeEnd,
      teaching_start: p.teachingStart,
      teaching_end: p.teachingEnd,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
    };
  }

  async updateProfile(userId: string, updates: any): Promise<any> {
    const db = getDb();

    const drizzleUpdates: any = {};
    if (updates.display_name !== undefined) drizzleUpdates.displayName = updates.display_name;
    if (updates.avatar_url !== undefined) drizzleUpdates.avatarUrl = updates.avatar_url;
    if (updates.timezone !== undefined) drizzleUpdates.timezone = updates.timezone;
    if (updates.teaching_days !== undefined) drizzleUpdates.teachingDays = updates.teaching_days;
    if (updates.college_start !== undefined) drizzleUpdates.collegeStart = updates.college_start;
    if (updates.college_end !== undefined) drizzleUpdates.collegeEnd = updates.college_end;
    if (updates.teaching_start !== undefined) drizzleUpdates.teachingStart = updates.teaching_start;
    if (updates.teaching_end !== undefined) drizzleUpdates.teachingEnd = updates.teaching_end;

    const updated: ProfileDrizzle[] = await (db as any)
      .update(profiles)
      .set({ ...drizzleUpdates, updatedAt: new Date() })
      .where(eq(profiles.id, userId))
      .returning();

    if (!updated.length) throw new Error(`Profile not found: ${userId}`);

    const p = updated[0];
    return {
      id: p.id,
      display_name: p.displayName,
      avatar_url: p.avatarUrl,
      timezone: p.timezone,
      total_xp: p.totalXp,
      level: p.level,
      current_streak: p.currentStreak,
      longest_streak: p.longestStreak,
      tasks_completed_total: p.tasksCompletedTotal,
      teaching_days: p.teachingDays,
      college_start: p.collegeStart,
      college_end: p.collegeEnd,
      teaching_start: p.teachingStart,
      teaching_end: p.teachingEnd,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
    };
  }

  async createProfile(userId: string, displayName?: string): Promise<any> {
    const db = getDb();

    const created: ProfileDrizzle[] = await (db as any)
      .insert(profiles)
      .values({
        id: userId,
        displayName: displayName || null,
        teachingDays: "[1,3,5]",
        collegeStart: "09:00",
        collegeEnd: "17:00",
        teachingStart: "17:30",
        teachingEnd: "21:30",
      })
      .onConflictDoNothing()
      .returning();

    // If onConflictDoNothing hit a race (another request created it first), fetch it
    const p = created.length ? created[0] : (await this.getProfileRow(userId));
    if (!p) throw new Error(`Failed to create profile: ${userId}`);

    return {
      id: p.id,
      display_name: p.displayName,
      avatar_url: p.avatarUrl,
      timezone: p.timezone,
      total_xp: p.totalXp,
      level: p.level,
      current_streak: p.currentStreak,
      longest_streak: p.longestStreak,
      tasks_completed_total: p.tasksCompletedTotal,
      teaching_days: p.teachingDays,
      college_start: p.collegeStart,
      college_end: p.collegeEnd,
      teaching_start: p.teachingStart,
      teaching_end: p.teachingEnd,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
    };
  }

  private async getProfileRow(userId: string): Promise<ProfileDrizzle | null> {
    const db = getDb();
    const result: ProfileDrizzle[] = await (db as any).select().from(profiles).where(eq(profiles.id, userId));
    return result.length ? result[0] : null;
  }
}

/**
 * Task Repository Implementation
 */

/**
 * Task Repository Implementation
 */
export class DrizzleTaskRepository implements ITaskRepository {
  async getTodaysTasks(userId: string, date: string): Promise<any[]> {
    const db = getDb();
    const tasks: TaskInstanceDrizzle[] = await (db as any)
      .select()
      .from(taskInstances)
      .where(and(eq(taskInstances.userId, userId), eq(taskInstances.date, date)))
      .orderBy(desc(taskInstances.createdAt));
    return tasks.map(this.mapTaskToRepo);
  }

  async getTasksByDate(userId: string, date: string): Promise<any[]> {
    return this.getTodaysTasks(userId, date);
  }

  async getTaskInstance(id: string): Promise<any | null> {
    const db = getDb();
    const tasks: TaskInstanceDrizzle[] = await (db as any).select().from(taskInstances).where(eq(taskInstances.id, id));
    if (!tasks.length) return null;
    return this.mapTaskToRepo(tasks[0]);
  }

  async createTask(task: any): Promise<any> {
    const db = getDb();
    const created: TaskInstanceDrizzle[] = await (db as any)
      .insert(taskInstances)
      .values({
        userId: task.user_id,
        templateId: task.template_id,
        date: task.date,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority || "normal",
        difficulty: task.difficulty || "medium",
        xpReward: task.xp_reward,
        estimatedMinutes: task.estimated_minutes,
        dueTime: task.due_time,
        notes: task.notes,
      })
      .returning();
    if (!created.length) throw new Error("Failed to create task");
    return this.mapTaskToRepo(created[0]);
  }

  async updateTask(id: string, updates: any): Promise<any> {
    const db = getDb();

    const drizzleUpdates: any = {};
    if (updates.title !== undefined) drizzleUpdates.title = updates.title;
    if (updates.description !== undefined) drizzleUpdates.description = updates.description;
    if (updates.priority !== undefined) drizzleUpdates.priority = updates.priority;
    if (updates.difficulty !== undefined) drizzleUpdates.difficulty = updates.difficulty;
    if (updates.estimated_minutes !== undefined) drizzleUpdates.estimatedMinutes = updates.estimated_minutes;
    if (updates.due_time !== undefined) drizzleUpdates.dueTime = updates.due_time;
    if (updates.notes !== undefined) drizzleUpdates.notes = updates.notes;

    const updated: TaskInstanceDrizzle[] = await (db as any)
      .update(taskInstances)
      .set({ ...drizzleUpdates, updatedAt: new Date() })
      .where(eq(taskInstances.id, id))
      .returning();

    if (!updated.length) throw new Error(`Task not found: ${id}`);
    return this.mapTaskToRepo(updated[0]);
  }

  async deleteTask(id: string): Promise<void> {
    const db = getDb();
    await (db as any).delete(taskInstances).where(eq(taskInstances.id, id));
  }

  async completeTask(
    userId: string,
    taskInstanceId: string,
    idempotencyKey?: string
  ): Promise<CompleteTaskResult> {
    const db = getDb();

    const result = await db.transaction(async (tx: any) => {
      // Fetch task
      const tasks: TaskInstanceDrizzle[] = await tx.select().from(taskInstances).where(eq(taskInstances.id, taskInstanceId));
      if (!tasks.length) throw new Error(`Task not found: ${taskInstanceId}`);

      const task = tasks[0];
      if (task.completed) {
        return {
          success: false,
          already_completed: true,
          xp_awarded: 0,
          new_total_xp: 0,
          new_level: 1,
          level_up: false,
          new_achievements: [],
        };
      }

      const xpAwarded = task.xpReward;
      const completedAt = new Date();

      // Mark completed
      await tx.update(taskInstances).set({ completed: true, completedAt, updatedAt: completedAt }).where(eq(taskInstances.id, taskInstanceId));

      // Insert XP event with idempotency
      try {
        await tx.insert(xpEvents).values({
          userId,
          amount: xpAwarded,
          reason: "task_complete",
          idempotencyKey: idempotencyKey || null,
        });
      } catch (_err) {
        // Retry - idempotency key exists
        const profs: ProfileDrizzle[] = await tx.select().from(profiles).where(eq(profiles.id, userId));
        if (!profs.length) throw new Error(`Profile not found: ${userId}`);
        const newLevel = calculateLevelFromXp(profs[0].totalXp);
        return {
          success: true,
          xp_awarded: 0,
          new_total_xp: profs[0].totalXp,
          new_level: newLevel,
          level_up: false,
          new_achievements: [],
        };
      }

      // Get profile
      const profs: ProfileDrizzle[] = await tx.select().from(profiles).where(eq(profiles.id, userId));
      if (!profs.length) throw new Error(`Profile not found: ${userId}`);

      const newTotalXp = profs[0].totalXp + xpAwarded;
      const newLevel = calculateLevelFromXp(newTotalXp);
      const leveledUp = newLevel > profs[0].level;

      // Update profile
      await tx.update(profiles).set({
        totalXp: newTotalXp,
        level: newLevel,
        tasksCompletedTotal: (profs[0].tasksCompletedTotal || 0) + 1,
        updatedAt: new Date(),
      }).where(eq(profiles.id, userId));

      return {
        success: true,
        xp_awarded: xpAwarded,
        new_total_xp: newTotalXp,
        new_level: newLevel,
        level_up: leveledUp,
        new_achievements: [],
      };
    });

    return result;
  }

  async undoCompleteTask(taskInstanceId: string): Promise<UndoTaskResult> {
    const db = getDb();

    const result = await db.transaction(async (tx: any) => {
      // Fetch task
      const tasks: TaskInstanceDrizzle[] = await tx.select().from(taskInstances).where(eq(taskInstances.id, taskInstanceId));
      if (!tasks.length) throw new Error(`Task not found: ${taskInstanceId}`);

      const task = tasks[0];
      if (!task.completed) {
        return {
          success: false,
          already_incomplete: true,
          xp_removed: 0,
          new_total_xp: 0,
          new_level: 1,
        };
      }

      const userId = task.userId;
      const xpToRemove = task.xpReward;

      // Mark incomplete
      await tx.update(taskInstances).set({ completed: false, completedAt: null, updatedAt: new Date() }).where(eq(taskInstances.id, taskInstanceId));

      // Insert reversal event
      await tx.insert(xpEvents).values({
        userId,
        amount: -xpToRemove,
        reason: "task_undo",
      });

      // Get profile
      const profs: ProfileDrizzle[] = await tx.select().from(profiles).where(eq(profiles.id, userId));
      if (!profs.length) throw new Error(`Profile not found: ${userId}`);

      const newTotalXp = Math.max(0, profs[0].totalXp - xpToRemove);
      const newLevel = calculateLevelFromXp(newTotalXp);

      // Update profile
      await tx.update(profiles).set({
        totalXp: newTotalXp,
        level: newLevel,
        tasksCompletedTotal: Math.max(0, (profs[0].tasksCompletedTotal || 1) - 1),
        updatedAt: new Date(),
      }).where(eq(profiles.id, userId));

      return {
        success: true,
        xp_removed: xpToRemove,
        new_total_xp: newTotalXp,
        new_level: newLevel,
      };
    });

    return result;
  }

  async carryForwardTask(sourceTaskId: string, newDate: string): Promise<any> {
    const db = getDb();

    const tasks: TaskInstanceDrizzle[] = await (db as any).select().from(taskInstances).where(eq(taskInstances.id, sourceTaskId));
    if (!tasks.length) throw new Error(`Source task not found: ${sourceTaskId}`);

    const sourceTask = tasks[0];
    const created: TaskInstanceDrizzle[] = await (db as any)
      .insert(taskInstances)
      .values({
        userId: sourceTask.userId,
        templateId: sourceTask.templateId,
        date: newDate,
        title: sourceTask.title,
        description: sourceTask.description,
        category: sourceTask.category,
        priority: sourceTask.priority,
        difficulty: sourceTask.difficulty,
        xpReward: sourceTask.xpReward,
        estimatedMinutes: sourceTask.estimatedMinutes,
        dueTime: sourceTask.dueTime,
        notes: sourceTask.notes,
        completed: false,
        completedAt: null,
        carriedFromTaskInstanceId: sourceTaskId,
      })
      .returning();

    if (!created.length) throw new Error("Failed to carry forward task");
    return this.mapTaskToRepo(created[0]);
  }

  async generateDailyTasks(userId: string, date: string): Promise<number> {
    const recurringRepo = new DrizzleRecurringTemplateRepository();
    return recurringRepo.generateDailyTasks(userId, date);
  }

  private mapTaskToRepo(task: TaskInstanceDrizzle): any {
    return {
      id: task.id,
      user_id: task.userId,
      template_id: task.templateId,
      date: task.date,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      difficulty: task.difficulty,
      xp_reward: task.xpReward,
      estimated_minutes: task.estimatedMinutes,
      due_time: task.dueTime,
      notes: task.notes,
      completed: task.completed,
      completed_at: task.completedAt?.toISOString() || null,
      carried_from_task_instance_id: task.carriedFromTaskInstanceId,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    };
  }
}

/**
 * Recurring Template Repository Implementation
 */
export class DrizzleRecurringTemplateRepository
  implements IRecurringTemplateRepository
{
  async getTemplates(userId: string): Promise<any[]> {
    const db = getDb();
    const templates: RecurringTemplateDrizzle[] = await (db as any)
      .select()
      .from(recurringTemplates)
      .where(eq(recurringTemplates.userId, userId))
      .orderBy(desc(recurringTemplates.createdAt));
    return templates.map(this.mapTemplateToRepo);
  }

  async getActiveTemplates(userId: string): Promise<any[]> {
    const db = getDb();
    const templates: RecurringTemplateDrizzle[] = await (db as any)
      .select()
      .from(recurringTemplates)
      .where(and(eq(recurringTemplates.userId, userId), eq(recurringTemplates.isActive, true)))
      .orderBy(desc(recurringTemplates.createdAt));
    return templates.map(this.mapTemplateToRepo);
  }

  async getTemplate(id: string): Promise<any | null> {
    const db = getDb();
    const templates: RecurringTemplateDrizzle[] = await (db as any).select().from(recurringTemplates).where(eq(recurringTemplates.id, id));
    if (!templates.length) return null;
    return this.mapTemplateToRepo(templates[0]);
  }

  async createTemplate(template: any): Promise<any> {
    const db = getDb();
    const created: RecurringTemplateDrizzle[] = await (db as any)
      .insert(recurringTemplates)
      .values({
        userId: template.user_id,
        title: template.title,
        description: template.description,
        category: template.category,
        priority: template.priority || "normal",
        difficulty: template.difficulty || "medium",
        xpReward: template.xp_reward,
        estimatedMinutes: template.estimated_minutes,
        dueTime: template.due_time,
        recurrenceType: template.recurrence_type || "daily",
        recurrenceDays: template.recurrence_days,
        isActive: true,
        startsOn: template.starts_on || new Date().toISOString().split("T")[0],
        endsOn: template.ends_on,
      })
      .returning();
    if (!created.length) throw new Error("Failed to create recurring template");
    return this.mapTemplateToRepo(created[0]);
  }

  async updateTemplate(id: string, updates: any): Promise<any> {
    const db = getDb();

    const drizzleUpdates: any = {};
    if (updates.title !== undefined) drizzleUpdates.title = updates.title;
    if (updates.description !== undefined) drizzleUpdates.description = updates.description;
    if (updates.priority !== undefined) drizzleUpdates.priority = updates.priority;
    if (updates.difficulty !== undefined) drizzleUpdates.difficulty = updates.difficulty;
    if (updates.is_active !== undefined) drizzleUpdates.isActive = updates.is_active;
    if (updates.ends_on !== undefined) drizzleUpdates.endsOn = updates.ends_on;

    const updated: RecurringTemplateDrizzle[] = await (db as any)
      .update(recurringTemplates)
      .set({ ...drizzleUpdates, updatedAt: new Date() })
      .where(eq(recurringTemplates.id, id))
      .returning();

    if (!updated.length) throw new Error(`Recurring template not found: ${id}`);
    return this.mapTemplateToRepo(updated[0]);
  }

  async deleteTemplate(id: string): Promise<void> {
    const db = getDb();
    await (db as any).delete(recurringTemplates).where(eq(recurringTemplates.id, id));
  }

  async generateDailyTasks(userId: string, date: string): Promise<number> {
    const db = getDb();
    let tasksGenerated = 0;

    const templates: RecurringTemplateDrizzle[] = await (db as any)
      .select()
      .from(recurringTemplates)
      .where(and(eq(recurringTemplates.userId, userId), eq(recurringTemplates.isActive, true), lte(recurringTemplates.startsOn, date)));

    for (const template of templates) {
      if (template.endsOn && template.endsOn < date) continue;

      if (!this.shouldGenerateForDate(template, date)) continue;

      const existing: TaskInstanceDrizzle[] = await (db as any)
        .select()
        .from(taskInstances)
        .where(and(eq(taskInstances.userId, userId), eq(taskInstances.date, date), eq(taskInstances.templateId, template.id)));

      if (existing.length) continue;

      await (db as any).insert(taskInstances).values({
        userId,
        templateId: template.id,
        date,
        title: template.title,
        description: template.description,
        category: template.category,
        priority: template.priority,
        difficulty: template.difficulty,
        xpReward: template.xpReward,
        estimatedMinutes: template.estimatedMinutes,
        dueTime: template.dueTime,
        completed: false,
        completedAt: null,
      });

      tasksGenerated++;
    }

    return tasksGenerated;
  }

  private shouldGenerateForDate(template: RecurringTemplateDrizzle, dateStr: string): boolean {
    const date = new Date(dateStr);
    const dayOfWeek = date.getUTCDay();
    const ianaWeekday = dayOfWeek === 0 ? 7 : dayOfWeek;

    switch (template.recurrenceType) {
      case "daily":
        return true;
      case "weekdays":
        return ianaWeekday >= 1 && ianaWeekday <= 5;
      case "weekly":
        return true;
      case "custom":
        if (!template.recurrenceDays) return false;
        try {
          return JSON.parse(template.recurrenceDays).includes(ianaWeekday);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private mapTemplateToRepo(template: RecurringTemplateDrizzle): any {
    return {
      id: template.id,
      user_id: template.userId,
      title: template.title,
      description: template.description,
      category: template.category,
      priority: template.priority,
      difficulty: template.difficulty,
      xp_reward: template.xpReward,
      estimated_minutes: template.estimatedMinutes,
      due_time: template.dueTime,
      recurrence_type: template.recurrenceType,
      recurrence_days: template.recurrenceDays,
      is_active: template.isActive,
      starts_on: template.startsOn,
      ends_on: template.endsOn,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
    };
  }
}

/**
 * Schedule Repository Implementation
 */
export class DrizzleScheduleRepository implements IScheduleRepository {
  async getSchedule(userId: string): Promise<any[]> {
    const db = getDb();
    const blocks: ScheduleBlockDrizzle[] = await (db as any).select().from(scheduleBlocks).where(eq(scheduleBlocks.userId, userId)).orderBy(desc(scheduleBlocks.createdAt));
    return blocks.map(this.mapBlockToRepo);
  }

  async getActiveSchedule(userId: string): Promise<any[]> {
    const db = getDb();
    const blocks: ScheduleBlockDrizzle[] = await (db as any)
      .select()
      .from(scheduleBlocks)
      .where(and(eq(scheduleBlocks.userId, userId), eq(scheduleBlocks.isActive, true)))
      .orderBy(desc(scheduleBlocks.createdAt));
    return blocks.map(this.mapBlockToRepo);
  }

  async getScheduleBlock(id: string): Promise<any | null> {
    const db = getDb();
    const blocks: ScheduleBlockDrizzle[] = await (db as any).select().from(scheduleBlocks).where(eq(scheduleBlocks.id, id));
    if (!blocks.length) return null;
    return this.mapBlockToRepo(blocks[0]);
  }

  async createScheduleBlock(block: any): Promise<any> {
    const db = getDb();
    const created: ScheduleBlockDrizzle[] = await (db as any)
      .insert(scheduleBlocks)
      .values({
        userId: block.user_id,
        title: block.title,
        type: block.type,
        startTime: block.start_time,
        endTime: block.end_time,
        recurrenceDays: block.recurrence_days,
        isActive: block.is_active !== undefined ? block.is_active : true,
      })
      .returning();
    if (!created.length) throw new Error("Failed to create schedule block");
    return this.mapBlockToRepo(created[0]);
  }

  async updateScheduleBlock(id: string, updates: any): Promise<any> {
    const db = getDb();

    const drizzleUpdates: any = {};
    if (updates.title !== undefined) drizzleUpdates.title = updates.title;
    if (updates.type !== undefined) drizzleUpdates.type = updates.type;
    if (updates.start_time !== undefined) drizzleUpdates.startTime = updates.start_time;
    if (updates.end_time !== undefined) drizzleUpdates.endTime = updates.end_time;
    if (updates.recurrence_days !== undefined) drizzleUpdates.recurrenceDays = updates.recurrence_days;
    if (updates.is_active !== undefined) drizzleUpdates.isActive = updates.is_active;

    const updated: ScheduleBlockDrizzle[] = await (db as any)
      .update(scheduleBlocks)
      .set({ ...drizzleUpdates, updatedAt: new Date() })
      .where(eq(scheduleBlocks.id, id))
      .returning();

    if (!updated.length) throw new Error(`Schedule block not found: ${id}`);
    return this.mapBlockToRepo(updated[0]);
  }

  async deleteScheduleBlock(id: string): Promise<void> {
    const db = getDb();
    await (db as any).delete(scheduleBlocks).where(eq(scheduleBlocks.id, id));
  }

  private mapBlockToRepo(block: ScheduleBlockDrizzle): any {
    return {
      id: block.id,
      user_id: block.userId,
      title: block.title,
      type: block.type,
      start_time: block.startTime,
      end_time: block.endTime,
      recurrence_days: block.recurrenceDays,
      is_active: block.isActive,
      created_at: block.createdAt.toISOString(),
      updated_at: block.updatedAt.toISOString(),
    };
  }
}

/**
 * History Repository Implementation
 */
export class DrizzleHistoryRepository implements IHistoryRepository {
  async getDailySummary(userId: string, date: string): Promise<any | null> {
    const db = getDb();
    const summaries: DailySummaryDrizzle[] = await (db as any).select().from(dailySummaries).where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date)));
    if (!summaries.length) return null;

    const s = summaries[0];
    return {
      id: s.id,
      user_id: s.userId,
      date: s.date,
      tasks_completed: s.tasksCompleted,
      tasks_total: s.tasksTotal,
      completion_percentage: s.completionPercentage,
      xp_earned: s.xpEarned,
      created_at: s.createdAt.toISOString(),
    };
  }

  async getDailySummaries(userId: string, startDate: string, endDate: string): Promise<any[]> {
    const db = getDb();
    const summaries: DailySummaryDrizzle[] = await (db as any)
      .select()
      .from(dailySummaries)
      .where(and(eq(dailySummaries.userId, userId), gte(dailySummaries.date, startDate), lte(dailySummaries.date, endDate)))
      .orderBy(desc(dailySummaries.date));
    return summaries.map((s) => ({
      id: s.id,
      user_id: s.userId,
      date: s.date,
      tasks_completed: s.tasksCompleted,
      tasks_total: s.tasksTotal,
      completion_percentage: s.completionPercentage,
      xp_earned: s.xpEarned,
      created_at: s.createdAt.toISOString(),
    }));
  }

  async getTasksByDate(userId: string, date: string): Promise<any[]> {
    const db = getDb();
    const tasks: TaskInstanceDrizzle[] = await (db as any)
      .select()
      .from(taskInstances)
      .where(and(eq(taskInstances.userId, userId), eq(taskInstances.date, date)))
      .orderBy(desc(taskInstances.createdAt));
    return tasks.map((t) => ({
      id: t.id,
      user_id: t.userId,
      template_id: t.templateId,
      date: t.date,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      difficulty: t.difficulty,
      xp_reward: t.xpReward,
      estimated_minutes: t.estimatedMinutes,
      due_time: t.dueTime,
      notes: t.notes,
      completed: t.completed,
      completed_at: t.completedAt?.toISOString() || null,
      carried_from_task_instance_id: t.carriedFromTaskInstanceId,
      created_at: t.createdAt.toISOString(),
      updated_at: t.updatedAt.toISOString(),
    }));
  }
}

/**
 * Achievements Repository Implementation
 */
export class DrizzleAchievementRepository implements IAchievementRepository {
  async getAllAchievements(): Promise<any[]> {
    const db = getDb();
    const allAchievements: AchievementDrizzle[] = await (db as any).select().from(achievements).orderBy(desc(achievements.sortOrder));
    return allAchievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      sort_order: a.sortOrder,
      created_at: a.createdAt.toISOString(),
    }));
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const db = getDb();
    const userAchievements_: UserAchievementDrizzle[] = await (db as any)
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
    return userAchievements_.map((ua) => ({
      id: ua.id,
      user_id: ua.userId,
      achievement_id: ua.achievementId,
      unlocked_at: ua.unlockedAt.toISOString(),
      created_at: ua.createdAt.toISOString(),
    }));
  }

  async getUnlockedAchievementIds(userId: string): Promise<string[]> {
    const db = getDb();
    const userAchievements_: UserAchievementDrizzle[] = await (db as any).select().from(userAchievements).where(eq(userAchievements.userId, userId));
    return userAchievements_.map((ua) => ua.achievementId);
  }
}
