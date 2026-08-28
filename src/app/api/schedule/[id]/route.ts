/**
 * PATCH /api/schedule/[id] - Update a schedule block
 * DELETE /api/schedule/[id] - Delete a schedule block
 */

import { NextRequest } from "next/server";
import { requireAuth, verifyOwnership } from "@/lib/auth/server";
import { apiSuccess, apiError, handleApiError, ValidationError } from "@/lib/api/response";
import { DrizzleScheduleRepository } from "@/lib/data/drizzle-repositories";
import type { ScheduleUpdate } from "@/lib/data/repositories";

/**
 * PATCH /api/schedule/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const scheduleRepo = new DrizzleScheduleRepository();
    const block = await scheduleRepo.getScheduleBlock(id);

    if (!block) {
      return apiError("Schedule block not found", 404);
    }

    // Verify ownership
    verifyOwnership(block.user_id, auth.userId, "Schedule block");

    // Build update object - only allow specific fields
    const update: ScheduleUpdate = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        throw new ValidationError("Invalid 'title'");
      }
      update.title = body.title;
    }

    if (body.type !== undefined) {
      if (typeof body.type !== "string") {
        throw new ValidationError("Invalid 'type'");
      }
      update.type = body.type;
    }

    if (body.startTime !== undefined) {
      if (typeof body.startTime !== "string") {
        throw new ValidationError("Invalid 'startTime'");
      }
      update.start_time = body.startTime;
    }

    if (body.endTime !== undefined) {
      if (typeof body.endTime !== "string") {
        throw new ValidationError("Invalid 'endTime'");
      }
      update.end_time = body.endTime;
    }

        if (body.recurrenceDays !== undefined) {
      if (!Array.isArray(body.recurrenceDays)) {
        throw new ValidationError("Invalid 'recurrenceDays'");
      }
      update.days_of_week = body.recurrenceDays;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        throw new ValidationError("Invalid 'isActive'");
      }
      update.is_active = body.isActive;
    }

    if (Object.keys(update).length === 0) {
      throw new ValidationError("No valid fields to update");
    }

    const updated = await scheduleRepo.updateScheduleBlock(id, update);

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/schedule/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;

    const scheduleRepo = new DrizzleScheduleRepository();
    const block = await scheduleRepo.getScheduleBlock(id);

    if (!block) {
      return apiError("Schedule block not found", 404);
    }

    // Verify ownership
    verifyOwnership(block.user_id, auth.userId, "Schedule block");

    await scheduleRepo.deleteScheduleBlock(id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}