/**
 * POST /api/tasks/[id]/undo - Undo task completion
 * 
 * Atomic transaction:
 * - Authenticate user
 * - Verify task ownership
 * - Verify task is completed
 * - Mark task incomplete
 * - Insert reversal XP event
 * - Update profile XP/level
 * - Prevent negative XP
 */

import { NextRequest } from "next/server";
import { requireAuth, verifyOwnership } from "@/lib/auth/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { DrizzleTaskRepository } from "@/lib/data/drizzle-repositories";

/**
 * POST /api/tasks/[id]/undo
 */
export async function POST(
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

    // Verify ownership - throws AuthorizationError if not owner
    verifyOwnership(task.user_id, auth.userId, "Task");

    // Execute atomic undo transaction
    const result = await taskRepo.undoCompleteTask(id);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
