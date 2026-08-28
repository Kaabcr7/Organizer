/**
 * GET /api/profile - Get user's profile
 * PATCH /api/profile - Update user's profile
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { apiSuccess, apiError, handleApiError, ValidationError } from "@/lib/api/response";
import { DrizzleProfileRepository } from "@/lib/data/drizzle-repositories";
import type { ProfileUpdate } from "@/lib/data/repositories";

/**
 * GET /api/profile
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();

    const profileRepo = new DrizzleProfileRepository();
    let profile = await profileRepo.getProfile(auth.userId);

    if (!profile) {
      profile = await profileRepo.createProfile(auth.userId);
    }

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await request.json();

    // Build update object - only allow specific fields
    const update: ProfileUpdate = {};

    if (body.displayName !== undefined) {
      if (typeof body.displayName !== "string") {
        throw new ValidationError("Invalid 'displayName'");
      }
      update.display_name = body.displayName;
    }

    if (body.avatarUrl !== undefined) {
      update.avatar_url = body.avatarUrl;
    }

    if (body.timezone !== undefined) {
      if (typeof body.timezone !== "string") {
        throw new ValidationError("Invalid 'timezone'");
      }
      update.timezone = body.timezone;
    }

    if (body.teachingDays !== undefined) {
      if (typeof body.teachingDays !== "string") {
        throw new ValidationError("Invalid 'teachingDays'");
      }
      update.teaching_days = body.teachingDays;
    }

    if (body.collegeStart !== undefined) {
      if (typeof body.collegeStart !== "string") {
        throw new ValidationError("Invalid 'collegeStart'");
      }
      update.college_start = body.collegeStart;
    }

    if (body.collegeEnd !== undefined) {
      if (typeof body.collegeEnd !== "string") {
        throw new ValidationError("Invalid 'collegeEnd'");
      }
      update.college_end = body.collegeEnd;
    }

    if (body.teachingStart !== undefined) {
      if (typeof body.teachingStart !== "string") {
        throw new ValidationError("Invalid 'teachingStart'");
      }
      update.teaching_start = body.teachingStart;
    }

    if (body.teachingEnd !== undefined) {
      if (typeof body.teachingEnd !== "string") {
        throw new ValidationError("Invalid 'teachingEnd'");
      }
      update.teaching_end = body.teachingEnd;
    }

    // Do NOT allow client to update XP/level directly
    if (body.totalXp !== undefined || body.level !== undefined) {
      throw new ValidationError(
        "Cannot update totalXp or level directly. Complete tasks to earn XP."
      );
    }

    if (Object.keys(update).length === 0) {
      throw new ValidationError("No valid fields to update");
    }

    const profileRepo = new DrizzleProfileRepository();
    const updated = await profileRepo.updateProfile(auth.userId, update);

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
