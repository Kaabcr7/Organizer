/**
 * Client-side API utilities for calling server endpoints
 * All mutations and queries go through these functions
 * Handles error responses and type conversion
 *
 * The database/API speaks snake_case, the frontend speaks camelCase.
 * Every conversion happens here at the API boundary so that nothing
 * downstream ever has to know about the wire format.
 */

import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskDifficulty,
} from "@/types/task";
import type { ScheduleBlock, ScheduleBlockType } from "@/types/schedule";
import type { Achievement, UserStats } from "@/types/gamification";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Unwrap the `{ success, data }` envelope produced by `apiSuccess`/`apiError`.
 *
 * Error responses carry the message under `error` (see lib/api/response.ts),
 * so that key has to be read first or every failure degrades to "HTTP 500".
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError(
        response.status,
        "invalid_response",
        response.ok
          ? "Malformed JSON in server response"
          : text.slice(0, 200) || `HTTP ${response.status}`
      );
    }
  }

  const envelope = (payload ?? {}) as Record<string, unknown>;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof envelope.code === "string" ? envelope.code : "unknown_error",
      (typeof envelope.error === "string" && envelope.error) ||
        (typeof envelope.message === "string" && envelope.message) ||
        `HTTP ${response.status}`
    );
  }

  // Unwrap deliberately checks for the key rather than truthiness: `data` is
  // legitimately null (no daily summary), 0, "" or [] on several endpoints.
  if (payload !== null && typeof payload === "object" && "data" in envelope) {
    return envelope.data as T;
  }

  return payload as T;
}

/**
 * Postgres `time` columns come back as "HH:MM:SS"; the UI works in "HH:MM"
 * (and compares those strings lexicographically), so normalise on the way in.
 */
function toHhMm(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "";
  const [hours = "00", minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function optionalHhMm(value: unknown): string | undefined {
  const normalized = toHhMm(value);
  return normalized === "" ? undefined : normalized;
}

/**
 * Parse a `recurrence_days` / `teaching_days` column: a JSON array of ISO
 * weekday numbers (1 = Monday … 7 = Sunday), or null meaning "every day".
 */
export function parseWeekdays(value: unknown): number[] | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const days = parsed
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7);
    return days.length > 0 ? days : null;
  } catch {
    return null;
  }
}

/**
 * Map an API task instance onto the frontend `Task` shape.
 *
 * `xpReward` in particular must never be undefined: the reducer adds it to
 * `stats.totalXp`, so a missing value turns the running XP total into NaN.
 */
function mapTask(raw: Record<string, any>): Task {
  const templateId = raw.template_id ?? raw.templateId ?? null;

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    category: (raw.category ?? "other") as TaskCategory,
    priority: (raw.priority ?? "normal") as TaskPriority,
    difficulty: (raw.difficulty ?? "medium") as TaskDifficulty,
    xpReward: Number(raw.xp_reward ?? raw.xpReward ?? 0),
    estimatedMinutes:
      raw.estimated_minutes ?? raw.estimatedMinutes ?? undefined,
    dueTime: optionalHhMm(raw.due_time ?? raw.dueTime),
    completed: Boolean(raw.completed),
    completedAt: raw.completed_at ?? raw.completedAt ?? undefined,
    isRecurring: templateId !== null && templateId !== undefined,
    notes: raw.notes ?? undefined,
    date: raw.date,
  };
}

/**
 * A schedule block plus the recurrence metadata the store needs to decide
 * whether the block applies to a given day.
 */
export interface ApiScheduleBlock extends ScheduleBlock {
  recurrenceDays: number[] | null;
  isActive: boolean;
}

function mapScheduleBlock(raw: Record<string, any>): ApiScheduleBlock {
  return {
    id: raw.id,
    title: raw.title,
    type: (raw.type ?? "free") as ScheduleBlockType,
    startTime: toHhMm(raw.start_time ?? raw.startTime),
    endTime: toHhMm(raw.end_time ?? raw.endTime),
    // `schedule_blocks` has no is_fixed column, so nothing can be reported as
    // fixed until the schema grows one.
    isFixed: false,
    recurrenceDays: parseWeekdays(raw.recurrence_days ?? raw.recurrenceDays),
    isActive: (raw.is_active ?? raw.isActive ?? true) !== false,
  };
}

/**
 * The profile row, exposed in camelCase. The raw snake_case keys are kept on
 * the object as well so existing readers keep working.
 */
function mapProfile(raw: Record<string, any>): UserStats {
  return {
    ...raw,
    displayName: raw.display_name ?? "",
    avatarUrl: raw.avatar_url ?? null,
    totalXp: Number(raw.total_xp ?? 0),
    level: Number(raw.level ?? 1),
    currentStreak: Number(raw.current_streak ?? 0),
    longestStreak: Number(raw.longest_streak ?? 0),
    tasksCompletedTotal: Number(raw.tasks_completed_total ?? 0),
    teachingDays: raw.teaching_days ?? null,
    collegeStart: toHhMm(raw.college_start),
    collegeEnd: toHhMm(raw.college_end),
    teachingStart: toHhMm(raw.teaching_start),
    teachingEnd: toHhMm(raw.teaching_end),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as UserStats;
}

/**
 * Task Operations
 */
export const tasksApi = {
  async getTodaysTasks(date: string): Promise<Task[]> {
    const response = await fetch(
      `/api/tasks?date=${encodeURIComponent(date)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const tasks = await handleResponse<any[]>(response);

    return (tasks ?? []).map(mapTask);
  },

  async createTask(payload: {
    title: string;
    description?: string;
    date: string;
    category: string;
    priority?: string;
    difficulty?: string;
    xpReward: number;
    estimatedMinutes?: number;
    dueTime?: string;
    templateId?: string;
    carriedFromTaskInstanceId?: string;
  }): Promise<Task> {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return mapTask(await handleResponse<any>(response));
  },

  async updateTask(id: string, updates: Record<string, any>): Promise<Task> {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    return mapTask(await handleResponse<any>(response));
  },

  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    await handleResponse<void>(response);
  },

  async completeTask(id: string, idempotencyKey?: string): Promise<any> {
    const response = await fetch(`/api/tasks/${id}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify({ idempotencyKey }),
    });

    return handleResponse<any>(response);
  },

  async undoCompleteTask(id: string): Promise<any> {
    const response = await fetch(`/api/tasks/${id}/undo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    return handleResponse<any>(response);
  },

  async carryForwardTask(id: string, date: string): Promise<Task> {
    const response = await fetch(`/api/tasks/${id}/carry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });

    return mapTask(await handleResponse<any>(response));
  },
};

/**
 * Profile Operations
 */
export const profileApi = {
  async getProfile(): Promise<UserStats> {
    const response = await fetch("/api/profile", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return mapProfile(await handleResponse<any>(response));
  },

  async updateProfile(updates: Record<string, any>): Promise<UserStats> {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    return mapProfile(await handleResponse<any>(response));
  },
};

/**
 * History Operations
 */
export const historyApi = {
  async getHistory(startDate: string, endDate: string): Promise<any[]> {
    const response = await fetch(
      `/api/history?startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    return (await handleResponse<any[]>(response)) ?? [];
  },

  async getDailySummary(date: string): Promise<any | null> {
    const response = await fetch(
      `/api/history?date=${encodeURIComponent(date)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await handleResponse<any | null>(response);
    if (!result) return null;

    return {
      ...result,
      tasks: (result.tasks ?? []).map(mapTask),
    };
  },
};

/**
 * Schedule Operations
 */
export const scheduleApi = {
  async getSchedule(): Promise<ApiScheduleBlock[]> {
    const response = await fetch("/api/schedule", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const blocks = await handleResponse<any[]>(response);

    return (blocks ?? []).map(mapScheduleBlock);
  },

  async updateScheduleBlock(
    id: string,
    updates: Record<string, any>
  ): Promise<ApiScheduleBlock> {
    const response = await fetch(`/api/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    return mapScheduleBlock(await handleResponse<any>(response));
  },

  async deleteScheduleBlock(id: string): Promise<void> {
    const response = await fetch(`/api/schedule/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    await handleResponse<void>(response);
  },
};

/**
 * Recurring Task Operations
 */
export const recurringApi = {
  async getActiveRecurringTasks(date: string): Promise<Task[]> {
    const response = await fetch(
      `/api/recurring?date=${encodeURIComponent(date)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const templates = await handleResponse<any[]>(response);

    return (templates ?? []).map((template) => ({
      ...mapTask(template),
      // Templates carry no per-day instance state.
      completed: false,
      completedAt: undefined,
      isRecurring: true,
      date: template.date ?? "",
    }));
  },
};

/**
 * Achievement Operations
 */
export const achievementsApi = {
  async getAchievements(): Promise<Achievement[]> {
    const response = await fetch("/api/achievements", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await handleResponse<{
      all?: any[];
      unlocked?: any[];
      unlockedIds?: string[];
    }>(response);

    const all = result?.all ?? [];
    const unlockedIds = new Set(result?.unlockedIds ?? []);

    // The join rows carry the unlock timestamp; index them by achievement id.
    const unlockedAtById = new Map<string, string>();
    for (const row of result?.unlocked ?? []) {
      const achievementId = row.achievement_id ?? row.achievementId;
      const unlockedAt = row.unlocked_at ?? row.unlockedAt;
      if (achievementId && unlockedAt) {
        unlockedAtById.set(achievementId, unlockedAt);
      }
    }

    return all.map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      isUnlocked: unlockedIds.has(achievement.id),
      unlockedAt: unlockedAtById.get(achievement.id),
    }));
  },
};
