/**
 * AUTH INTEGRATION TESTS
 * 
 * Tests verify the Better Auth authentication layer:
 * - getAuthenticatedUser() returns correct context
 * - requireAuth() throws when not authenticated
 * - verifyOwnership() enforces user isolation
 * - AuthenticationError and AuthorizationError classes
 * 
 * These tests mock the Better Auth session API to avoid
 * needing a live HTTP server or DB connections.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the better-auth module
vi.mock("../better-auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

import {
  getAuthenticatedUser,
  requireAuth,
  verifyOwnership,
  AuthenticationError,
  AuthorizationError,
} from "../server";
import { auth } from "../better-auth";

describe("AUTH: getAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return user context when session is valid", async () => {
    const mockSession = {
      user: {
        id: "user-123-abc",
        email: "test@example.com",
        name: "Test User",
      },
      session: {
        id: "session-456",
        token: "valid-token",
        expiresAt: new Date(Date.now() + 86400000),
      },
    };

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);

    const result = await getAuthenticatedUser();

    expect(result).not.toBeNull();
    expect(result!.userId).toBe("user-123-abc");
    expect(result!.email).toBe("test@example.com");
  });

  it("should return null when no session exists", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

    const result = await getAuthenticatedUser();

    expect(result).toBeNull();
  });

  it("should return null when session has no user", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: null,
      session: null,
    } as never);

    const result = await getAuthenticatedUser();

    expect(result).toBeNull();
  });

  it("should return null and not throw on auth service errors", async () => {
    vi.mocked(auth.api.getSession).mockRejectedValue(
      new Error("Connection refused")
    );

    const result = await getAuthenticatedUser();

    expect(result).toBeNull();
  });
});

describe("AUTH: requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return authenticated context when session is valid", async () => {
    const mockSession = {
      user: {
        id: "user-789-def",
        email: "authed@example.com",
        name: "Authed User",
      },
      session: {
        id: "session-abc",
        token: "valid-token-2",
        expiresAt: new Date(Date.now() + 86400000),
      },
    };

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);

    const result = await requireAuth();

    expect(result.userId).toBe("user-789-def");
    expect(result.email).toBe("authed@example.com");
  });

  it("should throw AuthenticationError when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

    await expect(requireAuth()).rejects.toThrow(AuthenticationError);
    await expect(requireAuth()).rejects.toThrow("Not authenticated");
  });

  it("should throw AuthenticationError on auth service failure", async () => {
    vi.mocked(auth.api.getSession).mockRejectedValue(
      new Error("DB timeout")
    );

    await expect(requireAuth()).rejects.toThrow(AuthenticationError);
  });
});

describe("AUTH: verifyOwnership", () => {
  it("should not throw when user IDs match", () => {
    expect(() => {
      verifyOwnership("user-123", "user-123", "task");
    }).not.toThrow();
  });

  it("should throw AuthorizationError when user IDs do not match", () => {
    expect(() => {
      verifyOwnership("user-123", "user-456", "task");
    }).toThrow(AuthorizationError);
  });

  it("should include resource name in error message", () => {
    expect(() => {
      verifyOwnership("owner-a", "requester-b", "profile");
    }).toThrow("profile belongs to different user");
  });

  it("should use default resource name when not specified", () => {
    expect(() => {
      verifyOwnership("owner-a", "requester-b");
    }).toThrow("resource belongs to different user");
  });
});

describe("AUTH: Error classes", () => {
  it("AuthenticationError has correct name", () => {
    const error = new AuthenticationError("test");
    expect(error.name).toBe("AuthenticationError");
    expect(error.message).toBe("test");
    expect(error instanceof Error).toBe(true);
  });

  it("AuthorizationError has correct name", () => {
    const error = new AuthorizationError("test");
    expect(error.name).toBe("AuthorizationError");
    expect(error.message).toBe("test");
    expect(error instanceof Error).toBe(true);
  });
});
