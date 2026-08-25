import { test, expect } from "@playwright/test";

test.describe("Focus Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/focus");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("shows task selector and start button", async ({ page }) => {
    await page.goto("/focus");
    await expect(page.getByText("Select a task to focus on")).toBeVisible();
    await expect(page.getByRole("button", { name: /Start Session/ })).toBeVisible();
  });

  test("can start a focus session", async ({ page }) => {
    await page.goto("/focus");
    await page.getByRole("button", { name: /Start Session/ }).click();

    // Should show pause button and timer
    await expect(page.getByRole("button", { name: /Pause/ })).toBeVisible();
    await expect(page.getByText("Focusing...")).toBeVisible();
  });

  test("can pause and resume", async ({ page }) => {
    await page.goto("/focus");
    await page.getByRole("button", { name: /Start Session/ }).click();

    // Pause
    await page.getByRole("button", { name: /Pause/ }).click();
    await expect(page.getByText("Paused")).toBeVisible();

    // Resume
    await page.getByRole("button", { name: /Resume/ }).click();
    await expect(page.getByText("Focusing...")).toBeVisible();
  });
});
