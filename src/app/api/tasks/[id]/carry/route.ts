/**
 * POST /api/tasks/[id]/carry - Carry forward a task to a new date
 * 
 * Creates a new task instance for the target date based on the source task.
 * The new task gets a database-generated UUID.
 */

import { NextRequest } from "next/server";
import { requireAuth, verifyOwnership } from "@/lib/auth/server";
import { apiSuccess, apiError, handleApiError, ValidationError } from "@/lib/api/response";
import { DrizzleTaskRepository } from "@/lib/data/drizzle-repositories";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const newDate = body.date;
    if (!newDate || typeof newDate !== "string") {
      throw new ValidationError("Missing or invalid 'date'");
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      throw new ValidationError("Invalid date format. Use YYYY-MM-DD");
    }

    const taskRepo = new DrizzleTaskRepository();
    const task = await taskRepo.getTaskInstance(id);

    if (!task) {
      return apiError("Task not found", 404);
    }

    // Verify ownership
    verifyOwnership(task.user_id, auth.userId, "Task");

    // Carry forward - creates new task with database-generated UUID
    const carriedTask = await taskRepo.carryForwardTask(id, newDate);

    return apiSuccess(carriedTask, 201);
  } catch (error) {
    return handleApiError(error);
  }
}