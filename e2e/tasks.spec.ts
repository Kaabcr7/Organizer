import { test, expect } from "@playwright/test";

test.describe("Task Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("can complete a task", async ({ page }) => {
    await page.goto("/");
    // Find the first completion button (Mark complete)
    const completeBtn = page.getByLabel("Mark complete").first();
    await completeBtn.click();

    // Task should transition to completed state (Mark incomplete button appears)
    await expect(page.getByLabel("Mark incomplete").first()).toBeVisible();
  });

  test("can navigate to tasks page", async ({ page }) => {
    await page.goto("/");
    // Click Tasks in sidebar (desktop) or bottom nav
    await page.getByRole("link", { name: /Tasks/ }).first().click();
    await expect(page).toHaveURL("/tasks");
    await expect(page.locator("h1")).toContainText("Tasks");
  });

  test("can open add task dialog", async ({ page }) => {
    await page.goto("/tasks");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Click Add Task button
    await page.getByText("Add Task").click();
    // Dialog should appear
    await expect(page.getByText("New Task")).toBeVisible();
    await expect(page.getByLabel("Title")).toBeVisible();
  });

  test("can add a new task", async ({ page }) => {
    await page.goto("/tasks");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByText("Add Task").click();
    await page.getByLabel("Title").fill("My New Test Task");
    await page.getByRole("button", { name: "Add Task" }).click();

    // Dialog should close and new task should appear
    await expect(page.getByText("My New Test Task")).toBeVisible();
  });
});
