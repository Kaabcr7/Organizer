# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: edit-task.spec.ts >> Edit Task >> can edit a task title
- Location: e2e\edit-task.spec.ts:25:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.evaluate: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Task actions').first()

```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - alert [ref=f2e2]
  - generic [ref=f2e3]:
    - complementary [ref=f2e4]:
      - generic [ref=f2e5]: Organizer
      - navigation [ref=f2e10]:
        - link "Home" [ref=f2e11] [cursor=pointer]:
          - /url: /
        - link "Schedule" [ref=f2e17] [cursor=pointer]:
          - /url: /schedule
        - link "Tasks" [ref=f2e20] [cursor=pointer]:
          - /url: /tasks
        - link "History" [ref=f2e24] [cursor=pointer]:
          - /url: /history
        - link "Stats" [ref=f2e29] [cursor=pointer]:
          - /url: /stats
        - link "Focus" [ref=f2e32] [cursor=pointer]:
          - /url: /focus
        - link "Settings" [ref=f2e37] [cursor=pointer]:
          - /url: /settings
      - generic [ref=f2e41]:
        - generic [ref=f2e42]:
          - generic [ref=f2e43]:
            - generic [ref=f2e44]: Level 6
            - generic [ref=f2e45]: 1,420 XP
          - progressbar [ref=f2e46]: x
        - button "Sign Out" [ref=f2e49]
    - main [ref=f2e53]:
      - generic [ref=f2e57]:
        - generic [ref=f2e58]:
          - heading "Organizer" [level=1] [ref=f2e59]
          - paragraph [ref=f2e60]: Master your tasks, level up your life
        - generic [ref=f2e61]:
          - generic [ref=f2e62]:
            - generic [ref=f2e63]: Email
            - textbox "Email" [ref=f2e64]:
              - /placeholder: you@example.com
          - generic [ref=f2e65]:
            - generic [ref=f2e66]: Password
            - textbox "Password" [ref=f2e67]:
              - /placeholder: ••••••••
          - button "Sign In" [disabled] [ref=f2e68]
          - paragraph [ref=f2e69]:
            - text: Don't have an account?
            - link "Sign up" [ref=f2e70] [cursor=pointer]:
              - /url: /auth/signup
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Edit Task", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/tasks");
  6  |     await page.evaluate(() => localStorage.clear());
  7  |     await page.reload();
  8  |   });
  9  | 
  10 |   test("can open edit dialog from task menu", async ({ page }) => {
  11 |     await page.goto("/tasks");
  12 |     // Force the menu trigger visible and click it
  13 |     const menuTrigger = page.getByLabel("Task actions").first();
  14 |     await menuTrigger.evaluate((el) => (el as HTMLElement).style.opacity = "1");
  15 |     await menuTrigger.click();
  16 |     // Click Edit
  17 |     await page.getByText("Edit").click();
  18 |     // Edit dialog should appear
  19 |     await expect(page.getByText("Edit Task")).toBeVisible();
  20 |     // Title should be preloaded
  21 |     const titleInput = page.getByLabel("Title");
  22 |     await expect(titleInput).toHaveValue("Complete OS assignment");
  23 |   });
  24 | 
  25 |   test("can edit a task title", async ({ page }) => {
  26 |     await page.goto("/tasks");
  27 |     // Force the menu trigger visible
  28 |     const menuTrigger = page.getByLabel("Task actions").first();
> 29 |     await menuTrigger.evaluate((el) => (el as HTMLElement).style.opacity = "1");
     |                       ^ Error: locator.evaluate: Test timeout of 30000ms exceeded.
  30 |     await menuTrigger.click();
  31 |     await page.getByText("Edit").click();
  32 | 
  33 |     // Change the title
  34 |     const titleInput = page.getByLabel("Title");
  35 |     await titleInput.clear();
  36 |     await titleInput.fill("Updated Assignment Title");
  37 |     await page.getByRole("button", { name: "Save Changes" }).click();
  38 | 
  39 |     // New title should appear
  40 |     await expect(page.getByText("Updated Assignment Title")).toBeVisible();
  41 |   });
  42 | });
  43 | 
```