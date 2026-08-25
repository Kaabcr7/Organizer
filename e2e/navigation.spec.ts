import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("navigates between all pages", async ({ page }) => {
    await page.goto("/");

    // Navigate to Schedule
    await page.getByRole("link", { name: /Schedule/ }).first().click();
    await expect(page).toHaveURL("/schedule");
    await expect(page.locator("h1")).toContainText("Schedule");

    // Navigate to Tasks
    await page.getByRole("link", { name: /Tasks/ }).first().click();
    await expect(page).toHaveURL("/tasks");
    await expect(page.locator("h1")).toContainText("Tasks");

    // Navigate to Stats
    await page.getByRole("link", { name: /Stats/ }).first().click();
    await expect(page).toHaveURL("/stats");
    await expect(page.locator("h1")).toContainText("Statistics");

    // Navigate to Focus
    await page.getByRole("link", { name: /Focus/ }).first().click();
    await expect(page).toHaveURL("/focus");
    await expect(page.locator("h1")).toContainText("Focus Mode");

    // Navigate back to Home
    await page.getByRole("link", { name: /Home/ }).first().click();
    await expect(page).toHaveURL("/");
  });
});
