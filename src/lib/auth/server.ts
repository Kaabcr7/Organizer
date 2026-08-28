/**
 * Server-side authentication abstraction
 * 
 * This layer provides authenticated user ID to API routes.
 * Uses Better Auth sessions (Phase 9 migration).
 * 
 * IMPORTANT: Never trust user_id from request bodies or query parameters.
 * Always extract from authenticated session on server.
 */

import { auth } from "./better-auth";
import { headers } from "next/headers";

/**
 * Authenticated request context
 */
export interface AuthenticatedContext {
  userId: string;
  email?: string;
}

/**
 * Get authenticated user from request headers/session
 * 
 * Returns null if not authenticated.
 * Throws on auth service errors.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedContext | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return null;
    }

    return {
      userId: session.user.id,
      email: session.user.email,
    };
  } catch (error) {
    console.error("Failed to get authenticated user:", error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 * 
 * Use this in API routes that require authentication.
 */
export async function requireAuth(): Promise<AuthenticatedContext> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    throw new AuthenticationError("Not authenticated");
  }

  return auth;
}

/**
 * Authentication error
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization error (authenticated but not authorized)
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Verify user owns a resource
 * 
 * Throws AuthorizationError if ownership check fails.
 */
export function verifyOwnership(
  resourceUserId: string,
  authenticatedUserId: string,
  resourceName: string = "resource"
) {
  if (resourceUserId !== authenticatedUserId) {
    throw new AuthorizationError(
      `Unauthorized: ${resourceName} belongs to different user`
    );
  }
}
