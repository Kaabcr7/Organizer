/**
 * GET /api/recurring - List user's recurring templates
 * POST /api/recurring - Create a new recurring template
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { apiSuccess, apiError, handleApiError, ValidationError } from "@/lib/api/response";
import { DrizzleRecurringTemplateRepository } from "@/lib/data/drizzle-repositories";
import type { RecurringInsert } from "@/lib/data/repositories";

/**
 * GET /api/recurring?activeOnly=true
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const recurringRepo = new DrizzleRecurringTemplateRepository();
    const templates = activeOnly
      ? await recurringRepo.getActiveTemplates(auth.userId)
      : await recurringRepo.getTemplates(auth.userId);

    return apiSuccess(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/recurring - Create a new recurring template
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== "string") {
      throw new ValidationError("Missing or invalid 'title'");
    }

    if (!body.category || typeof body.category !== "string") {
      throw new ValidationError("Missing or invalid 'category'");
    }

    if (body.xpReward === undefined || typeof body.xpReward !== "number") {
      throw new ValidationError("Missing or invalid 'xpReward'");
    }

    const validXpRewards = [10, 25, 50, 100];
    if (!validXpRewards.includes(body.xpReward)) {
      throw new ValidationError("xpReward must be one of: 10, 25, 50, 100");
    }

    if (
      body.recurrenceType &&
      !["daily", "weekdays", "weekly", "custom"].includes(body.recurrenceType)
    ) {
      throw new ValidationError(
        "recurrenceType must be one of: daily, weekdays, weekly, custom"
      );
    }

    const template: RecurringInsert = {
      user_id: auth.userId,
      title: body.title,
      description: body.description ?? null,
      category: body.category,
      priority: body.priority ?? "normal",
      difficulty: body.difficulty ?? "medium",
      xp_reward: body.xpReward,
      estimated_minutes: body.estimatedMinutes ?? null,
      due_time: body.dueTime ?? null,
      recurrence_type: body.recurrenceType ?? "daily",
      recurrence_days: body.recurrenceDays ?? null,
      is_active: true,
      starts_on: body.startsOn ?? new Date().toISOString().split("T")[0],
      ends_on: body.endsOn ?? null,
    };

    const recurringRepo = new DrizzleRecurringTemplateRepository();
    const created = await recurringRepo.createTemplate(template);

    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
