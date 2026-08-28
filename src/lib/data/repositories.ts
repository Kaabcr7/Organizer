/**
 * Repository interfaces - defines the contract for data access
 * Implementations use Supabase but can be swapped out for testing
 */

import type { Database } from "@/lib/data/db-types";

// Type aliases for convenience
type TaskInstance = Database["public"]["Tables"]["task_instances"]["Row"];
type TaskInsert = Database["public"]["Tables"]["task_instances"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["task_instances"]["Update"];

type RecurringTemplate = Database["public"]["Tables"]["recurring_templates"]["Row"];
type RecurringInsert = Database["public"]["Tables"]["recurring_templates"]["Insert"];
type RecurringUpdate = Database["public"]["Tables"]["recurring_templates"]["Update"];

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];

type ScheduleBlock = Database["public"]["Tables"]["schedule_blocks"]["Row"];
type ScheduleInsert = Database["public"]["Tables"]["schedule_blocks"]["Insert"];
type ScheduleUpdate = Database["public"]["Tables"]["schedule_blocks"]["Update"];

type DailySummary = Database["public"]["Tables"]["daily_summaries"]["Row"];

/**
 * Profile repository - manages user profile and stats
 */
export interface IProfileRepository {
  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile>;
}

/**
 * Task instances repository - manages individual task occurrences
 */
export interface ITaskRepository {
  getTodaysTasks(userId: string, date: string): Promise<TaskInstance[]>;
  getTasksByDate(userId: string, date: string): Promise<TaskInstance[]>;
  getTaskInstance(id: string): Promise<TaskInstance | null>;
  createTask(task: TaskInsert): Promise<TaskInstance>;
  updateTask(id: string, updates: TaskUpdate): Promise<TaskInstance>;
  deleteTask(id: string): Promise<void>;
  
  // RPC operations - must use database functions
  completeTask(
    taskInstanceId: string,
    idempotencyKey?: string
  ): Promise<CompleteTaskResult>;
  undoCompleteTask(taskInstanceId: string): Promise<UndoTaskResult>;

  // Carry-forward
  carryForwardTask(
    sourceTaskId: string,
    newDate: string
  ): Promise<TaskInstance>;

  // Generate recurring tasks for a date
  generateDailyTasks(userId: string, date: string): Promise<number>;
}

/**
 * Recurring template repository
 */
export interface IRecurringTemplateRepository {
  getTemplates(userId: string): Promise<RecurringTemplate[]>;
  getActiveTemplates(userId: string): Promise<RecurringTemplate[]>;
  getTemplate(id: string): Promise<RecurringTemplate | null>;
  createTemplate(template: RecurringInsert): Promise<RecurringTemplate>;
  updateTemplate(id: string, updates: RecurringUpdate): Promise<RecurringTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // RPC operation
  generateDailyTasks(userId: string, date: string): Promise<number>;
}

/**
 * Schedule blocks repository
 */
export interface IScheduleRepository {
  getSchedule(userId: string): Promise<ScheduleBlock[]>;
  getActiveSchedule(userId: string): Promise<ScheduleBlock[]>;
  getScheduleBlock(id: string): Promise<ScheduleBlock | null>;
  createScheduleBlock(block: ScheduleInsert): Promise<ScheduleBlock>;
  updateScheduleBlock(
    id: string,
    updates: ScheduleUpdate
  ): Promise<ScheduleBlock>;
  deleteScheduleBlock(id: string): Promise<void>;
}

/**
 * History repository - daily summaries and historical data
 */
export interface IHistoryRepository {
  getDailySummary(userId: string, date: string): Promise<DailySummary | null>;
  getDailySummaries(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailySummary[]>;
  getTasksByDate(userId: string, date: string): Promise<TaskInstance[]>;
}

/**
 * Achievements repository
 */
export interface IAchievementRepository {
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  getUnlockedAchievementIds(userId: string): Promise<string[]>;
}

/**
 * Complete task RPC result
 */
export interface CompleteTaskResult {
  success: boolean;
  already_completed?: boolean;
  xp_awarded: number;
  new_total_xp: number;
  new_level: number;
  level_up: boolean;
  new_achievements: string[];
}

/**
 * Undo task RPC result
 */
export interface UndoTaskResult {
  success: boolean;
  already_incomplete?: boolean;
  xp_removed: number;
  new_total_xp: number;
  new_level: number;
}

/**
 * Repository factory - provides access to all repositories
 */
export interface IRepositoryFactory {
  profiles: IProfileRepository;
  tasks: ITaskRepository;
  recurringTemplates: IRecurringTemplateRepository;
  schedule: IScheduleRepository;
  history: IHistoryRepository;
  achievements: IAchievementRepository;
}

// Export type aliases
export type {
  TaskInstance,
  TaskInsert,
  TaskUpdate,
  RecurringTemplate,
  RecurringInsert,
  RecurringUpdate,
  Profile,
  ProfileUpdate,
  Achievement,
  UserAchievement,
  ScheduleBlock,
  ScheduleInsert,
  ScheduleUpdate,
  DailySummary,
};
