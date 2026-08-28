/**
 * GET /api/history - Get user's task history (daily summaries and tasks)
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { DrizzleHistoryRepository } from "@/lib/data/drizzle-repositories";

/**
 * GET /api/history?startDate=2026-08-01&endDate=2026-08-31
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const date = searchParams.get("date");

    const historyRepo = new DrizzleHistoryRepository();

    // If specific date requested, return tasks for that date
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return apiError("Invalid date format. Use YYYY-MM-DD", 400);
      }

      const tasks = await historyRepo.getTasksByDate(auth.userId, date);
      const summary = await historyRepo.getDailySummary(auth.userId, date);

      return apiSuccess({
        date,
        summary,
        tasks,
      });
    }

    // If date range requested, return summaries
    if (startDate && endDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return apiError("Invalid startDate format. Use YYYY-MM-DD", 400);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return apiError("Invalid endDate format. Use YYYY-MM-DD", 400);
      }

      const summaries = await historyRepo.getDailySummaries(
        auth.userId,
        startDate,
        endDate
      );

      return apiSuccess(summaries);
    }

    return apiError(
      "Provide either 'date' or both 'startDate' and 'endDate' query parameters",
      400
    );
  } catch (error) {
    return handleApiError(error);
  }
}
