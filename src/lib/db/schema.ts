/**
 * Organizer Database Schema - Drizzle ORM
 * PostgreSQL 18 on Neon
 *
 * Preserves all application entities:
 * - profiles (user identity & stats)
 * - task_instances (individual tasks)
 * - recurring_templates (task recurrence rules)
 * - xp_events (XP audit trail)
 * - daily_summaries (daily completion stats)
 * - schedule_blocks (user's schedule)
 * - achievements (global achievement definitions)
 * - user_achievements (user's progress)
 *
 * Foreign Key to Neon Auth:
 * - profiles.id references neon_auth.user.id (ON DELETE CASCADE)
 * - All user-owned tables reference profiles.id as user_id
 *
 * NOT CREATED HERE (pre-existing):
 * - neon_auth.user (Neon Auth identity)
 * - neon_auth.session (Neon Auth sessions)
 * - neon_auth.account (OAuth accounts)
 * - neon_auth.verification (Email verification)
 * - neon_auth.organization, member, project_config, invitation, jwks
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  date,
  time,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * PROFILES TABLE
 * User profile, settings, and cached XP/level/streak
 * Linked to Neon Auth user identity
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    // User identity from Neon Auth (neon_auth.user.id)
    displayName: text("display_name").notNull().default(""),
    avatarUrl: text("avatar_url"),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),

    // XP and Level (cache of SUM(xp_events.amount) and derived calculation)
    totalXp: integer("total_xp").notNull().default(0),
    level: integer("level").notNull().default(1),

    // Streaks
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),

    // Statistics cache
    tasksCompletedTotal: integer("tasks_completed_total").notNull().default(0),

    // Schedule configuration (IANA weekday numbers: 1=Mon, 7=Sun)
    // Stored as TEXT JSON array, e.g., "[1,3,5]"
    teachingDays: text("teaching_days")
      .notNull()
      .default("[1,3,5]")
      .$type<string>(),
    collegeStart: time("college_start").notNull().default("09:00"),
    collegeEnd: time("college_end").notNull().default("17:00"),
    teachingStart: time("teaching_start").notNull().default("17:30"),
    teachingEnd: time("teaching_end").notNull().default("21:30"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // Foreign key to Neon Auth user (delete cascade)
    // NOTE: This references neon_auth.user.id but the FK is managed separately
    // to avoid issues with Neon Auth schema. Application code must validate
    // that profiles are only created for existing neon_auth.user records.

    // Constraints
    check("total_xp_positive", sql`${table.totalXp} >= 0`),
    check("level_positive", sql`${table.level} >= 1`),
    check("streak_positive", sql`${table.currentStreak} >= 0`),
    check("longest_streak_positive", sql`${table.longestStreak} >= 0`),
    check("tasks_completed_positive", sql`${table.tasksCompletedTotal} >= 0`),
  ]
);

/**
 * RECURRING TEMPLATES TABLE
 * Template definitions for recurring tasks
 * Instances are generated per-day during daily rollover
 */
export const recurringTemplates = pgTable(
  "recurring_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    // Task details (same as task_instances)
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    priority: text("priority")
      .notNull()
      .default("normal")
      .$type<"low" | "normal" | "high" | "critical">(),
    difficulty: text("difficulty")
      .notNull()
      .default("medium")
      .$type<"easy" | "medium" | "hard" | "epic">(),
    xpReward: smallint("xp_reward").notNull(),
    estimatedMinutes: smallint("estimated_minutes"),
    dueTime: time("due_time"),

    // Recurrence configuration
    recurrenceType: text("recurrence_type")
      .notNull()
      .default("daily")
      .$type<"daily" | "weekdays" | "weekly" | "custom">(),
    // For "custom" type: array of ISO weekday numbers (1=Mon, 7=Sun)
    // Stored as TEXT JSON array, e.g., "[1,3,5]"
    recurrenceDays: text("recurrence_days").$type<string>(),

    // Lifecycle
    isActive: boolean("is_active").notNull().default(true),
    startsOn: date("starts_on").notNull().defaultNow(),
    endsOn: date("ends_on"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    check("title_not_empty", sql`char_length(${table.title}) > 0`),
    check("xp_reward_valid", sql`${table.xpReward} IN (10, 25, 50, 100)`),
    check("estimated_minutes_positive", sql`${table.estimatedMinutes} > 0`),
    check(
      "ends_on_after_starts",
      sql`${table.endsOn} IS NULL OR ${table.endsOn} >= ${table.startsOn}`
    ),
    index("idx_recurring_templates_user_active").on(
      table.userId,
      table.isActive
    ),
  ]
);

/**
 * TASK INSTANCES TABLE
 * Individual task occurrences - one per task per day
 * Fully denormalized for performance
 */
export const taskInstances = pgTable(
  "task_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    // Template reference (if from recurring template)
    templateId: uuid("template_id").references(() => recurringTemplates.id, {
      onDelete: "set null",
    }),

    // Date and basic info
    date: date("date").notNull(),
    title: text("title").notNull(),
    description: text("description"),

    // Task classification
    category: text("category").notNull(),
    priority: text("priority")
      .notNull()
      .default("normal")
      .$type<"low" | "normal" | "high" | "critical">(),
    difficulty: text("difficulty")
      .notNull()
      .default("medium")
      .$type<"easy" | "medium" | "hard" | "epic">(),

    // XP (static per task, actual award tracked in xp_events)
    xpReward: smallint("xp_reward").notNull(),

    // Task details
    estimatedMinutes: smallint("estimated_minutes"),
    dueTime: time("due_time"),
    notes: text("notes"),

    // Completion state
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at"),

    // Carry-forward reference (preserves provenance when task moved to next day)
    carriedFromTaskInstanceId: uuid("carried_from_task_instance_id"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    check("title_not_empty", sql`char_length(${table.title}) > 0`),
    check("xp_reward_valid", sql`${table.xpReward} IN (10, 25, 50, 100)`),
    check("estimated_minutes_positive", sql`${table.estimatedMinutes} > 0`),
    check(
      "completed_at_only_when_completed",
      sql`(${table.completed} = false AND ${table.completedAt} IS NULL) OR (${table.completed} = true AND ${table.completedAt} IS NOT NULL)`
    ),

    // Indexes for common queries
    index("idx_task_instances_user_date").on(table.userId, table.date),
    index("idx_task_instances_user_completed").on(
      table.userId,
      table.completed
    ),
    index("idx_task_instances_template_id").on(table.templateId),
  ]
);

/**
 * XP EVENTS TABLE
 * Audit trail of all XP awards and reversals
 * Authoritative source for user's total XP
 */
export const xpEvents = pgTable(
  "xp_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    // Amount and reason
    amount: smallint("amount").notNull(),
    reason: text("reason").notNull(), // "task_complete", "achievement", etc.

    // Idempotency key prevents duplicate awards on retry
    // Generated by client: "task-<id>-<timestamp>"
    idempotencyKey: text("idempotency_key"),

    // Timestamp
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_xp_events_idempotency").on(table.idempotencyKey),
    index("idx_xp_events_user_id").on(table.userId),
  ]
);

/**
 * DAILY SUMMARIES TABLE
 * Derived/cache data: daily completion stats
 * Created at end of day (during rollover)
 */
export const dailySummaries = pgTable(
  "daily_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    // The date this summary represents
    date: date("date").notNull(),

    // Completion stats
    tasksCompleted: integer("tasks_completed").notNull().default(0),
    tasksTotal: integer("tasks_total").notNull().default(0),
    completionPercentage: integer("completion_percentage").notNull().default(0),

    // XP earned on this day
    xpEarned: integer("xp_earned").notNull().default(0),

    // Timestamp
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    check("tasks_completed_non_negative", sql`${table.tasksCompleted} >= 0`),
    check("tasks_total_positive", sql`${table.tasksTotal} > 0`),
    check(
      "completion_percentage_valid",
      sql`${table.completionPercentage} >= 0 AND ${table.completionPercentage} <= 100`
    ),
    check("xp_earned_non_negative", sql`${table.xpEarned} >= 0`),

    // One summary per user per date
    uniqueIndex("idx_daily_summaries_user_date").on(table.userId, table.date),
  ]
);

/**
 * SCHEDULE BLOCKS TABLE
 * User's fixed schedule blocks (college, teaching, custom)
 * Supports local-time recurring schedules
 */
export const scheduleBlocks = pgTable(
  "schedule_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    // Block details
    title: text("title").notNull(),
    type: text("type").notNull(), // "college", "teaching", "custom", etc.

    // Times (in user's local timezone)
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),

    // Recurrence (ISO weekday numbers: 1=Mon, 7=Sun)
    // Stored as TEXT JSON array, e.g., "[1,3,5]" or null for every day
    recurrenceDays: text("recurrence_days").$type<string | null>(),

    // Lifecycle
    isActive: boolean("is_active").notNull().default(true),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    check("title_not_empty", sql`char_length(${table.title}) > 0`),
    index("idx_schedule_blocks_user_active").on(table.userId, table.isActive),
  ]
);

/**
 * ACHIEVEMENTS TABLE (Global)
 * Achievement definitions - shared across all users
 */
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // icon name or emoji
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * USER ACHIEVEMENTS TABLE
 * User's progress on achievements
 */
export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),

    // When unlocked
    unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // One achievement per user only
    uniqueIndex("idx_user_achievements_unique").on(
      table.userId,
      table.achievementId
    ),
  ]
);

/**
 * Export all tables for Drizzle
 */
export type Profile = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;

export type RecurringTemplate = typeof recurringTemplates.$inferSelect;
export type RecurringTemplateInsert = typeof recurringTemplates.$inferInsert;

export type TaskInstance = typeof taskInstances.$inferSelect;
export type TaskInstanceInsert = typeof taskInstances.$inferInsert;

export type XpEvent = typeof xpEvents.$inferSelect;
export type XpEventInsert = typeof xpEvents.$inferInsert;

export type DailySummary = typeof dailySummaries.$inferSelect;
export type DailySummaryInsert = typeof dailySummaries.$inferInsert;

export type ScheduleBlock = typeof scheduleBlocks.$inferSelect;
export type ScheduleBlockInsert = typeof scheduleBlocks.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type AchievementInsert = typeof achievements.$inferInsert;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type UserAchievementInsert = typeof userAchievements.$inferInsert;
