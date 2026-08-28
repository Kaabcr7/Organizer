# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tasks.spec.ts >> Task Interactions >> can complete a task
- Location: e2e\tasks.spec.ts:10:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Mark complete').first()

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
  3  | test.describe("Task Interactions", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await page.evaluate(() => localStorage.clear());
  7  |     await page.reload();
  8  |   });
  9  | 
  10 |   test("can complete a task", async ({ page }) => {
  11 |     await page.goto("/");
  12 |     // Find the first completion button (Mark complete)
  13 |     const completeBtn = page.getByLabel("Mark complete").first();
> 14 |     await completeBtn.click();
     |                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  15 | 
  16 |     // Task should transition to completed state (Mark incomplete button appears)
  17 |     await expect(page.getByLabel("Mark incomplete").first()).toBeVisible();
  18 |   });
  19 | 
  20 |   test("can navigate to tasks page", async ({ page }) => {
  21 |     await page.goto("/");
  22 |     // Click Tasks in sidebar (desktop) or bottom nav
  23 |     await page.getByRole("link", { name: /Tasks/ }).first().click();
  24 |     await expect(page).toHaveURL("/tasks");
  25 |     await expect(page.locator("h1")).toContainText("Tasks");
  26 |   });
  27 | 
  28 |   test("can open add task dialog", async ({ page }) => {
  29 |     await page.goto("/tasks");
  30 |     await page.evaluate(() => localStorage.clear());
  31 |     await page.reload();
  32 | 
  33 |     // Click Add Task button
  34 |     await page.getByText("Add Task").click();
  35 |     // Dialog should appear
  36 |     await expect(page.getByText("New Task")).toBeVisible();
  37 |     await expect(page.getByLabel("Title")).toBeVisible();
  38 |   });
  39 | 
  40 |   test("can add a new task", async ({ page }) => {
  41 |     await page.goto("/tasks");
  42 |     await page.evaluate(() => localStorage.clear());
  43 |     await page.reload();
  44 | 
  45 |     await page.getByText("Add Task").click();
  46 |     await page.getByLabel("Title").fill("My New Test Task");
  47 |     await page.getByRole("button", { name: "Add Task" }).click();
  48 | 
  49 |     // Dialog should close and new task should appear
  50 |     await expect(page.getByText("My New Test Task")).toBeVisible();
  51 |   });
  52 | });
  53 | 
```