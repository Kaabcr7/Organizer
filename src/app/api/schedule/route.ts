/**
 * GET /api/schedule - List user's schedule blocks
 * POST /api/schedule - Create a new schedule block
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { apiSuccess, apiError, handleApiError, ValidationError } from "@/lib/api/response";
import { DrizzleScheduleRepository } from "@/lib/data/drizzle-repositories";
import type { ScheduleInsert } from "@/lib/data/repositories";

/**
 * GET /api/schedule?activeOnly=true
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const scheduleRepo = new DrizzleScheduleRepository();
    const blocks = activeOnly
      ? await scheduleRepo.getActiveSchedule(auth.userId)
      : await scheduleRepo.getSchedule(auth.userId);

    return apiSuccess(blocks);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/schedule - Create a new schedule block
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== "string") {
      throw new ValidationError("Missing or invalid 'title'");
    }

    if (!body.type || typeof body.type !== "string") {
      throw new ValidationError("Missing or invalid 'type'");
    }

    if (!body.startTime || typeof body.startTime !== "string") {
      throw new ValidationError("Missing or invalid 'startTime'");
    }

    if (!body.endTime || typeof body.endTime !== "string") {
      throw new ValidationError("Missing or invalid 'endTime'");
    }

    const block: ScheduleInsert = {
      user_id: auth.userId,
      title: body.title,
      type: body.type,
      start_time: body.startTime,
      end_time: body.endTime,
      is_active: body.isActive !== false,
    };

    const scheduleRepo = new DrizzleScheduleRepository();
    const created = await scheduleRepo.createScheduleBlock(block);

    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
