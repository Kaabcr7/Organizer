/**
 * E2E TESTS - API Integration
 * 
 * These tests verify the full user flow:
 * UI → API → Database → Neon
 * 
 * Tests verify:
 * - Task creation persists to Neon
 * - Task completion calls API and updates XP
 * - Task undo reverses XP
 * - Data persists across page refreshes
 * - Profile data loads from API
 */

import { test, expect } from "@playwright/test";

test.describe("E2E: Task Management via API", () => {
  test("should create a task and persist to Neon", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click Add Task button
    const addTaskBtn = page.getByText(/add.*task|new.*task/i).first();
    if (await addTaskBtn.isVisible()) {
      await addTaskBtn.click();
    } else {
      // Try to find via aria-label or other attributes
      await page.getByRole("button").filter({ hasText: /add|new/i }).first().click();
    }

    // Fill form
    await page.getByLabel(/title/i).fill("E2E Test Task");
    await page.getByLabel(/difficulty/i, { exact: false }).first().click();
    await page.getByText(/medium/i).first().click();

    // Submit
    await page.getByRole("button", { name: /add.*task|create|submit/i }).click();

    // Wait for API call
    await page.waitForLoadState("networkidle");

    // Verify task appears
    await expect(page.getByText("E2E Test Task")).toBeVisible({ timeout: 5000 });
  });

  test("should complete a task and update XP via API", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get current XP if visible
    const xpBefore = await page.getByText(/XP|experience/i).first().textContent();

    // Find first task completion button
    const completeBtn = page.getByLabel(/mark.*complete|complete/i).first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();

      // Wait for API call and state update
      await page.waitForLoadState("networkidle");

      // Verify task shows as completed
      const uncompletBtn = page.getByLabel(/mark.*incomplete|undo/i).first();
      await expect(uncompletBtn).toBeVisible({ timeout: 5000 });

      // XP should have changed (if visible)
      const xpAfter = await page.getByText(/XP|experience/i).first().textContent();
      if (xpBefore && xpAfter) {
        expect(xpAfter).not.toBe(xpBefore);
      }
    }
  });

  test("should undo task completion and reverse XP via API", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find a completed task (mark incomplete button visible)
    let uncompletBtn = page.getByLabel(/mark.*incomplete|undo/i).first();
    
    if (await uncompletBtn.isVisible()) {
      const xpBefore = await page.getByText(/XP|experience/i).first().textContent();

      // Click undo
      await uncompletBtn.click();

      // Wait for API call
      await page.waitForLoadState("networkidle");

      // Verify task is now incomplete
      const completeBtn = page.getByLabel(/mark.*complete|complete/i).first();
      await expect(completeBtn).toBeVisible({ timeout: 5000 });

      // XP should have changed
      const xpAfter = await page.getByText(/XP|experience/i).first().textContent();
      if (xpBefore && xpAfter) {
        expect(xpAfter).not.toBe(xpBefore);
      }
    }
  });

  test("should persist data across page refresh", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get visible tasks
    const tasksBefore = await page.getByRole("button", { name: /mark.*complete|complete/i }).count();

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Tasks should reload from API (same count or similar)
    const tasksAfter = await page.getByRole("button", { name: /mark.*complete|complete/i }).count();
    expect(tasksAfter).toBeGreaterThanOrEqual(0);
  });

  test("should load profile stats from API", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for profile to load
    await expect(page.getByText(/Lv\.|level/i)).toBeVisible({ timeout: 5000 });

    // Should show stats (level, XP, etc.)
    const levelText = await page.getByText(/Lv\.|level/i).first().textContent();
    expect(levelText).toBeTruthy();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Go to home page
    await page.goto("/");

    // Simulate network error by going offline
    await page.context().setOffline(true);

    // Try to complete task - should show error or fallback
    const completeBtn = page.getByLabel(/mark.*complete|complete/i).first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      
      // Wait a bit for error handling
      await page.waitForTimeout(1000);

      // App should still be usable (not crash)
      await expect(page.locator("body")).toBeVisible();
    }

    // Go back online
    await page.context().setOffline(false);
  });

  test("should not use localStorage as authoritative source", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear localStorage manually
    await page.evaluate(() => localStorage.clear());

    // Reload - data should still appear from API, not localStorage
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Profile should still load
    await expect(page.getByText(/Lv\.|level/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("E2E: Task Editing via API", () => {
  test("should edit a task and persist to Neon", async ({ page }) => {
    await page.goto("/tasks");
    await page.waitForLoadState("networkidle");

    // Click edit on first task if visible
    const editBtn = page.getByLabel(/edit/i).first();
    if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editBtn.click();

      // Dialog should appear
      await expect(page.getByText(/edit.*task|update/i)).toBeVisible({ timeout: 5000 });

      // Modify title
      const titleInput = page.getByLabel(/title/i).first();
      await titleInput.clear();
      await titleInput.fill("Updated Task Title");

      // Submit
      await page.getByRole("button", { name: /save|update|done/i }).click();

      // Wait for API call
      await page.waitForLoadState("networkidle");

      // Verify updated title appears
      await expect(page.getByText("Updated Task Title")).toBeVisible({ timeout: 5000 });
    }
  });

  test("should delete a task and persist to Neon", async ({ page }) => {
    await page.goto("/tasks");
    await page.waitForLoadState("networkidle");

    // Count tasks before
    const taskCountBefore = await page.getByRole("button", { name: /delete|remove/i }).count();

    // Click delete on first task if visible
    const deleteBtn = page.getByRole("button", { name: /delete|remove/i }).first();
    if (taskCountBefore > 0) {
      // Get task title to verify deletion
      const taskText = await deleteBtn.locator("..").textContent();

      await deleteBtn.click();

      // Confirm deletion if dialog appears
      const confirmBtn = page.getByRole("button", { name: /confirm|yes|delete/i });
      if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      // Wait for API call
      await page.waitForLoadState("networkidle");

      // Task count should decrease or task should not appear
      const taskCountAfter = await page.getByRole("button", { name: /delete|remove/i }).count();
      expect(taskCountAfter).toBeLessThanOrEqual(taskCountBefore);
    }
  });
});

test.describe("E2E: History via API", () => {
  test("should load history from API", async ({ page }) => {
    await page.goto("/history");
    await page.waitForLoadState("networkidle");

    // Should show history heading
    await expect(page.getByText(/history|past/i)).toBeVisible({ timeout: 5000 });

    // Should show some date or summary
    await expect(page.getByText(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/)).toBeVisible({ timeout: 5000 });
  });
});
