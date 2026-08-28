/**
 * Client-side API utilities for calling server endpoints
 * All mutations and queries go through these functions
 * Handles error responses and type conversion
 */

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

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.code || "unknown_error",
      data.message || `HTTP ${response.status}`
    );
  }

  return data.data || data;
}

/**
 * Task Operations
 */
export const tasksApi = {
  async getTodaysTasks(date: string): Promise<any[]> {
    const response = await fetch(`/api/tasks?date=${encodeURIComponent(date)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
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
  }): Promise<any> {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async updateTask(id: string, updates: Record<string, any>): Promise<any> {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
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
        ...(idempotencyKey && { "X-Idempotency-Key": idempotencyKey }),
      },
      body: JSON.stringify({ idempotencyKey }),
    });
    return handleResponse(response);
  },

  async undoCompleteTask(id: string): Promise<any> {
    const response = await fetch(`/api/tasks/${id}/undo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
  },

  async carryForwardTask(id: string, date: string): Promise<any> {
    const response = await fetch(`/api/tasks/${id}/carry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    return handleResponse(response);
  },
};

/**
 * Profile Operations
 */
export const profileApi = {
  async getProfile(): Promise<any> {
    const response = await fetch("/api/profile", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
  },

  async updateProfile(updates: Record<string, any>): Promise<any> {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },
};

/**
 * History Operations
 */
export const historyApi = {
  async getHistory(startDate: string, endDate: string): Promise<any[]> {
    const response = await fetch(
      `/api/history?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    return handleResponse(response);
  },

  async getDailySummary(date: string): Promise<any | null> {
    const response = await fetch(`/api/history?date=${encodeURIComponent(date)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
  },
};

/**
 * Schedule Operations
 */
export const scheduleApi = {
  async getSchedule(): Promise<any[]> {
    const response = await fetch("/api/schedule", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
  },

  async updateScheduleBlock(id: string, updates: Record<string, any>): Promise<any> {
    const response = await fetch(`/api/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
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
  async getActiveRecurringTasks(date: string): Promise<any[]> {
    const response = await fetch(
      `/api/recurring?date=${encodeURIComponent(date)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    return handleResponse(response);
  },
};

/**
 * Achievement Operations
 */
export const achievementsApi = {
  async getAchievements(): Promise<any[]> {
    const response = await fetch("/api/achievements", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await handleResponse<{ all: any[] }>(response);
    // API returns { all: Achievement[], unlocked: ..., unlockedIds: ... }
    // Extract the 'all' array which is what the context expects
    return result.all || [];
  },
};
