import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("displays greeting and date", async ({ page }) => {
    await page.goto("/");
    // Should have a heading with time-based greeting
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(
      text?.includes("Good morning") ||
        text?.includes("Good afternoon") ||
        text?.includes("Good evening") ||
        text?.includes("Good night") ||
        text?.includes("Late night")
    ).toBe(true);
  });

  test("shows daily progress and stats", async ({ page }) => {
    await page.goto("/");
    // Should show tasks done count
    await expect(page.getByText(/tasks done/)).toBeVisible();
    // Should show streak
    await expect(page.getByText(/day streak/)).toBeVisible();
    // Should show level
    await expect(page.getByText(/Lv\./)).toBeVisible();
  });

  test("displays task list", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Today's Tasks")).toBeVisible();
    // Should show mock tasks
    await expect(page.getByText("Complete OS assignment").first()).toBeVisible();
    await expect(page.getByText("Solve 2 DSA problems").first()).toBeVisible();
  });

  test("shows schedule preview", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
    await expect(page.getByText("College").first()).toBeVisible();
  });
});
