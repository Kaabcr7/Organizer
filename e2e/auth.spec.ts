/**
 * E2E Auth Tests
 * 
 * Tests the complete authentication flow through the browser:
 * - Login page rendering
 * - Signup page rendering
 * - Protected route redirect
 * - Form validation
 * - Error display
 * 
 * Note: These tests verify UI behavior and routing.
 * Actual auth operations require a running Better Auth server.
 */

import { test, expect } from "@playwright/test";

test.describe("Auth: Login Page", () => {
  test("should display login form", async ({ page }) => {
    await page.goto("/auth/login");

    // Form elements should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should have link to signup page", async ({ page }) => {
    await page.goto("/auth/login");

    const signupLink = page.getByRole("link", { name: /sign up/i });
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute("href", "/auth/signup");
  });

  test("should disable submit button when fields are empty", async ({ page }) => {
    await page.goto("/auth/login");

    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await expect(submitBtn).toBeDisabled();
  });

  test("should enable submit button when fields are filled", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");

    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await expect(submitBtn).toBeEnabled();
  });
});

test.describe("Auth: Signup Page", () => {
  test("should display signup form", async ({ page }) => {
    await page.goto("/auth/signup");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    // Two password fields (password + confirm)
    const passwordFields = page.locator('input[type="password"]');
    await expect(passwordFields).toHaveCount(2);
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();
  });

  test("should have link to login page", async ({ page }) => {
    await page.goto("/auth/signup");

    const loginLink = page.getByRole("link", { name: /sign in/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/auth/login");
  });

  test("should disable submit button when fields are empty", async ({ page }) => {
    await page.goto("/auth/signup");

    const submitBtn = page.getByRole("button", { name: /sign up/i });
    await expect(submitBtn).toBeDisabled();
  });
});

test.describe("Auth: Protected Routes", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Try to access protected route without auth
    await page.goto("/tasks");

    // Should be redirected to login with next parameter
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect from root to login when not authenticated", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should preserve intended destination in redirect", async ({ page }) => {
    await page.goto("/stats");

    // Should redirect with next=/stats
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fstats/);
  });
});

test.describe("Auth: Public Routes", () => {
  test("login page should be accessible without auth", async ({ page }) => {
    const response = await page.goto("/auth/login");
    expect(response?.status()).toBe(200);
  });

  test("signup page should be accessible without auth", async ({ page }) => {
    const response = await page.goto("/auth/signup");
    expect(response?.status()).toBe(200);
  });
});
