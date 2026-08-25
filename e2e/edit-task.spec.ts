import { test, expect } from "@playwright/test";

test.describe("Edit Task", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("can open edit dialog from task menu", async ({ page }) => {
    await page.goto("/tasks");
    // Force the menu trigger visible and click it
    const menuTrigger = page.getByLabel("Task actions").first();
    await menuTrigger.evaluate((el) => (el as HTMLElement).style.opacity = "1");
    await menuTrigger.click();
    // Click Edit
    await page.getByText("Edit").click();
    // Edit dialog should appear
    await expect(page.getByText("Edit Task")).toBeVisible();
    // Title should be preloaded
    const titleInput = page.getByLabel("Title");
    await expect(titleInput).toHaveValue("Complete OS assignment");
  });

  test("can edit a task title", async ({ page }) => {
    await page.goto("/tasks");
    // Force the menu trigger visible
    const menuTrigger = page.getByLabel("Task actions").first();
    await menuTrigger.evaluate((el) => (el as HTMLElement).style.opacity = "1");
    await menuTrigger.click();
    await page.getByText("Edit").click();

    // Change the title
    const titleInput = page.getByLabel("Title");
    await titleInput.clear();
    await titleInput.fill("Updated Assignment Title");
    await page.getByRole("button", { name: "Save Changes" }).click();

    // New title should appear
    await expect(page.getByText("Updated Assignment Title")).toBeVisible();
  });
});
