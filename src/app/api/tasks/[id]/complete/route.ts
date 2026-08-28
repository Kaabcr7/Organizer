/**
 * POST /api/tasks/[id]/complete - Complete a task
 * 
 * Atomic transaction:
 * - Authenticate user
 * - Verify task ownership
 * - Verify task not already completed
 * - Mark task completed
 * - Insert XP event
 * - Update profile XP/level
 * - Evaluate achievements
 */

import { NextRequest } from "next/server";
import { requireAuth, verifyOwnership } from "@/lib/auth/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { DrizzleTaskRepository } from "@/lib/data/drizzle-repositories";

/**
 * POST /api/tasks/[id]/complete
 * 
 * Optional body:
 * {
 *   "idempotencyKey": "task-{id}-{timestamp}"  // For retry safety
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;

    let body: { idempotencyKey?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const taskRepo = new DrizzleTaskRepository();
    const task = await taskRepo.getTaskInstance(id);

    if (!task) {
      return apiError("Task not found", 404);
    }

    // Verify ownership - throws AuthorizationError if not owner
    verifyOwnership(task.user_id, auth.userId, "Task");

    // Execute atomic complete transaction
    const result = await taskRepo.completeTask(
      auth.userId,
      id,
      body.idempotencyKey
    );

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
