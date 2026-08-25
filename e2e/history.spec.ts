import { test, expect } from "@playwright/test";

test.describe("History Page", () => {
  test("shows history page with daily record", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Navigate to history
    await page.getByRole("link", { name: /History/ }).first().click();
    await expect(page).toHaveURL("/history");
    await expect(page.locator("h1")).toContainText("History");
  });

  test("shows today in history after tasks exist", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Complete a task to generate history
    const completeBtn = page.getByLabel("Mark complete").first();
    await completeBtn.click();

    // Navigate to history
    await page.getByRole("link", { name: /History/ }).first().click();
    await expect(page).toHaveURL("/history");

    // Should show "Today" entry
    await expect(page.getByText("Today")).toBeVisible();
  });
});
