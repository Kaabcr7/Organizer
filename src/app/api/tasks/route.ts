/**
 * GET /api/tasks - List user's tasks for a given date
 * POST /api/tasks - Create a new task
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { apiSuccess, apiError, handleApiError, ValidationError } from "@/lib/api/response";
import { DrizzleTaskRepository } from "@/lib/data/drizzle-repositories";
import type { TaskInsert } from "@/lib/data/repositories";

/**
 * GET /api/tasks?date=2026-08-25
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return apiError("Missing 'date' query parameter", 400);
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return apiError("Invalid date format. Use YYYY-MM-DD", 400);
    }

    const taskRepo = new DrizzleTaskRepository();
    
    // Generate recurring tasks for this date if they don't exist
    await taskRepo.generateDailyTasks(auth.userId, date);
    
    const tasks = await taskRepo.getTodaysTasks(auth.userId, date);

    return apiSuccess(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== "string") {
      throw new ValidationError("Missing or invalid 'title'");
    }

    if (!body.date || typeof body.date !== "string") {
      throw new ValidationError("Missing or invalid 'date'");
    }

    if (!body.category || typeof body.category !== "string") {
      throw new ValidationError("Missing or invalid 'category'");
    }

    if (body.xpReward === undefined || typeof body.xpReward !== "number") {
      throw new ValidationError("Missing or invalid 'xpReward'");
    }

    // Validate xpReward is one of the allowed values
    const validXpRewards = [10, 25, 50, 100];
    if (!validXpRewards.includes(body.xpReward)) {
      throw new ValidationError("xpReward must be one of: 10, 25, 50, 100");
    }

    // Build task insert with authenticated user ID
    const taskInsert: TaskInsert = {
      user_id: auth.userId,
      date: body.date,
      title: body.title,
      description: body.description ?? null,
      category: body.category,
      priority: body.priority ?? "normal",
      difficulty: body.difficulty ?? "medium",
      xp_reward: body.xpReward,
      estimated_minutes: body.estimatedMinutes ?? null,
      due_time: body.dueTime ?? null,
      notes: body.notes ?? null,
      template_id: body.templateId ?? null,
      completed: false,
      completed_at: null,
      carried_from_task_instance_id: body.carriedFromTaskInstanceId ?? null,
    };

    const taskRepo = new DrizzleTaskRepository();
    const created = await taskRepo.createTask(taskInsert);

    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
