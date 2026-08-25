/**
 * Supabase repository implementations
 * These implement the repository interfaces using Supabase client
 */

import { getClient } from "@/lib/supabase";
import type {
  IProfileRepository,
  ITaskRepository,
  IRecurringTemplateRepository,
  IScheduleRepository,
  IHistoryRepository,
  IAchievementRepository,
  CompleteTaskResult,
  UndoTaskResult,
  TaskInstance,
  TaskInsert,
  TaskUpdate,
  RecurringTemplate,
  RecurringInsert,
  RecurringUpdate,
  Profile,
  ProfileUpdate,
  ScheduleBlock,
  ScheduleInsert,
  ScheduleUpdate,
  DailySummary,
  Achievement,
  UserAchievement,
} from "./repositories";
import type { TaskCategory, TaskPriority, TaskDifficulty } from "@/types/task";

/**
 * Profile Repository Implementation
 */
export class SupabaseProfileRepository implements IProfileRepository {
  async getProfile(userId: string): Promise<Profile | null> {
    const client = getClient();
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(
    userId: string,
    updates: ProfileUpdate
  ): Promise<Profile> {
    const client = getClient();
    const { data, error } = await client
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Task Repository Implementation
 */
export class SupabaseTaskRepository implements ITaskRepository {
  async getTodaysTasks(userId: string, date: string): Promise<TaskInstance[]> {
    const client = getClient();
    const { data, error } = await client
      .from("task_instances")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getTasksByDate(userId: string, date: string): Promise<TaskInstance[]> {
    return this.getTodaysTasks(userId, date);
  }

  async getTaskInstance(id: string): Promise<TaskInstance | null> {
    const client = getClient();
    const { data, error } = await client
      .from("task_instances")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data;
  }

  async createTask(task: TaskInsert): Promise<TaskInstance> {
    const client = getClient();
    const { data, error } = await client
      .from("task_instances")
      .insert([task])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(id: string, updates: TaskUpdate): Promise<TaskInstance> {
    const client = getClient();
    const { data, error } = await client
      .from("task_instances")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from("task_instances").delete().eq("id", id);

    if (error) throw error;
  }

  async completeTask(
    taskInstanceId: string,
    idempotencyKey?: string
  ): Promise<CompleteTaskResult> {
    const client = getClient();
    const { data, error } = await client.rpc("complete_task", {
      p_task_instance_id: taskInstanceId,
      p_idempotency_key: idempotencyKey ?? undefined,
    });

    if (error) throw error;
    return data as unknown as CompleteTaskResult;
  }

  async undoCompleteTask(taskInstanceId: string): Promise<UndoTaskResult> {
    const client = getClient();
    const { data, error } = await client.rpc("undo_complete_task", {
      p_task_instance_id: taskInstanceId,
    });

    if (error) throw error;
    return data as unknown as UndoTaskResult;
  }

  async carryForwardTask(
    sourceTaskId: string,
    newDate: string
  ): Promise<TaskInstance> {
    // Get the source task
    const sourceTask = await this.getTaskInstance(sourceTaskId);
    if (!sourceTask) {
      throw new Error("Source task not found");
    }

    // Create new task with reference to source
    return this.createTask({
      user_id: sourceTask.user_id,
      template_id: sourceTask.template_id,
      date: newDate,
      title: sourceTask.title,
      description: sourceTask.description,
      category: sourceTask.category as TaskCategory,
      priority: sourceTask.priority as TaskPriority,
      difficulty: sourceTask.difficulty as TaskDifficulty,
      xp_reward: sourceTask.xp_reward,
      estimated_minutes: sourceTask.estimated_minutes,
      due_time: sourceTask.due_time,
      carried_from_task_instance_id: sourceTaskId,
    });
  }
}

/**
 * Recurring Template Repository Implementation
 */
export class SupabaseRecurringTemplateRepository
  implements IRecurringTemplateRepository
{
  async getTemplates(userId: string): Promise<RecurringTemplate[]> {
    const client = getClient();
    const { data, error } = await client
      .from("recurring_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getActiveTemplates(userId: string): Promise<RecurringTemplate[]> {
    const client = getClient();
    const { data, error } = await client
      .from("recurring_templates")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTemplate(id: string): Promise<RecurringTemplate | null> {
    const client = getClient();
    const { data, error } = await client
      .from("recurring_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  async createTemplate(
    template: RecurringInsert
  ): Promise<RecurringTemplate> {
    const client = getClient();
    const { data, error } = await client
      .from("recurring_templates")
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTemplate(
    id: string,
    updates: RecurringUpdate
  ): Promise<RecurringTemplate> {
    const client = getClient();
    const { data, error } = await client
      .from("recurring_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from("recurring_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  async generateDailyTasks(userId: string, date: string): Promise<number> {
    const client = getClient();
    const { data, error } = await client.rpc("generate_daily_tasks", {
      p_user_id: userId,
      p_date: date,
    });

    if (error) throw error;
    return data as number;
  }
}

/**
 * Schedule Repository Implementation
 */
export class SupabaseScheduleRepository implements IScheduleRepository {
  async getSchedule(userId: string): Promise<ScheduleBlock[]> {
    const client = getClient();
    const { data, error } = await client
      .from("schedule_blocks")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getActiveSchedule(userId: string): Promise<ScheduleBlock[]> {
    const client = getClient();
    const { data, error } = await client
      .from("schedule_blocks")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getScheduleBlock(id: string): Promise<ScheduleBlock | null> {
    const client = getClient();
    const { data, error } = await client
      .from("schedule_blocks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  async createScheduleBlock(
    block: ScheduleInsert
  ): Promise<ScheduleBlock> {
    const client = getClient();
    const { data, error } = await client
      .from("schedule_blocks")
      .insert([block])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateScheduleBlock(
    id: string,
    updates: ScheduleUpdate
  ): Promise<ScheduleBlock> {
    const client = getClient();
    const { data, error } = await client
      .from("schedule_blocks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteScheduleBlock(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from("schedule_blocks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}

/**
 * History Repository Implementation
 */
export class SupabaseHistoryRepository implements IHistoryRepository {
  async getDailySummary(
    userId: string,
    date: string
  ): Promise<DailySummary | null> {
    const client = getClient();
    const { data, error } = await client
      .from("daily_summaries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  async getDailySummaries(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailySummary[]> {
    const client = getClient();
    const { data, error } = await client
      .from("daily_summaries")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTasksByDate(userId: string, date: string): Promise<TaskInstance[]> {
    const client = getClient();
    const { data, error } = await client
      .from("task_instances")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

/**
 * Achievement Repository Implementation
 */
export class SupabaseAchievementRepository implements IAchievementRepository {
  async getAllAchievements(): Promise<Achievement[]> {
    const client = getClient();
    const { data, error } = await client
      .from("achievements")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const client = getClient();
    const { data, error } = await client
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUnlockedAchievementIds(userId: string): Promise<string[]> {
    const achievements = await this.getUserAchievements(userId);
    return achievements.map((a) => a.achievement_id);
  }
}
