/**
 * API response helpers
 */

import { NextResponse } from "next/server";
import type { AuthenticationError, AuthorizationError } from "@/lib/auth/server";

/**
 * Success response
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Error response
 */
export function apiError(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Handle errors in API routes
 */
export function handleApiError(error: unknown) {
  console.error("API error:", error);

  if (error instanceof Error) {
    const errorName = error.constructor.name;

    // Authentication error
    if (errorName === "AuthenticationError") {
      return apiError("Unauthorized", 401);
    }

    // Authorization error
    if (errorName === "AuthorizationError") {
      return apiError(error.message, 403);
    }

    // Validation error
    if (errorName === "ValidationError") {
      return apiError(error.message, 400);
    }

    // Database error
    if (error.message.includes("not found")) {
      return apiError(error.message, 404);
    }

    // Generic error
    return apiError(error.message, 500);
  }

  return apiError("Internal server error", 500);
}

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validate request body
 */
export function validateBody<T>(
  body: unknown,
  validator: (data: unknown) => data is T
): T {
  if (!validator(body)) {
    throw new ValidationError("Invalid request body");
  }
  return body;
}
