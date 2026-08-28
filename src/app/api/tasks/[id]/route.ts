/**
 * PATCH /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Delete a task
 */

import { NextRequest } from "next/server";
import { requireAuth, verifyOwnership } from "@/lib/auth/server";
import {
  apiSuccess,
  apiError,
  handleApiError,
  ValidationError,
} from "@/lib/api/response";
import { DrizzleTaskRepository } from "@/lib/data/drizzle-repositories";
import type { TaskUpdate } from "@/lib/data/repositories";

/**
 * PATCH /api/tasks/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;

    const taskRepo = new DrizzleTaskRepository();
    const task = await taskRepo.getTaskInstance(id);

    if (!task) {
      return apiError("Task not found", 404);
    }

    // Verify ownership
    verifyOwnership(task.user_id, auth.userId, "Task");

    const body = await request.json();

    // Build update object - only allow specific fields
    const update: TaskUpdate = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.length === 0) {
        throw new ValidationError("Invalid 'title'");
      }
      update.title = body.title;
    }

    if (body.description !== undefined) {
      update.description = body.description;
    }

    if (body.category !== undefined) {
      if (typeof body.category !== "string") {
        throw new ValidationError("Invalid 'category'");
      }
      update.category = body.category;
    }

    if (body.priority !== undefined) {
      update.priority = body.priority;
    }

    if (body.difficulty !== undefined) {
      update.difficulty = body.difficulty;
    }

    if (body.estimatedMinutes !== undefined) {
      update.estimated_minutes = body.estimatedMinutes;
    }

    if (body.dueTime !== undefined) {
      update.due_time = body.dueTime;
    }

    if (body.notes !== undefined) {
      update.notes = body.notes;
    }

    if (Object.keys(update).length === 0) {
      throw new ValidationError("No valid fields to update");
    }

    const updated = await taskRepo.updateTask(id, update);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tasks/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;

    const taskRepo = new DrizzleTaskRepository();
    const task = await taskRepo.getTaskInstance(id);

    if (!task) {
      return apiError("Task not found", 404);
    }

    // Verify ownership
    verifyOwnership(task.user_id as any, auth.userId, "Task");

    await taskRepo.deleteTask(id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
