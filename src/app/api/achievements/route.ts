/**
 * GET /api/achievements - Get all achievements and user's unlocked achievements
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { DrizzleAchievementRepository } from "@/lib/data/drizzle-repositories";

/**
 * GET /api/achievements
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();

    const achievementRepo = new DrizzleAchievementRepository();
    const allAchievements = await achievementRepo.getAllAchievements();
    const userAchievements = await achievementRepo.getUserAchievements(
      auth.userId
    );
    const unlockedIds = await achievementRepo.getUnlockedAchievementIds(
      auth.userId
    );

    return apiSuccess({
      all: allAchievements,
      unlocked: userAchievements,
      unlockedIds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
