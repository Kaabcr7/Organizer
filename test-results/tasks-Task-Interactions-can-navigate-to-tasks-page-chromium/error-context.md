# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tasks.spec.ts >> Task Interactions >> can navigate to tasks page
- Location: e2e\tasks.spec.ts:20:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/tasks"
Received: "http://localhost:3000/auth/login?next=%2Ftasks"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    2 × locator resolved to <html lang="en" class="dark">…</html>
      - unexpected value "http://localhost:3000/auth/login?next=%2F"
    11 × locator resolved to <html lang="en" class="dark">…</html>
       - unexpected value "http://localhost:3000/auth/login?next=%2Ftasks"

```

```yaml
- alert
- complementary:
  - text: Organizer
  - navigation:
    - link "Home":
      - /url: /
    - link "Schedule":
      - /url: /schedule
    - link "Tasks":
      - /url: /tasks
    - link "History":
      - /url: /history
    - link "Stats":
      - /url: /stats
    - link "Focus":
      - /url: /focus
    - link "Settings":
      - /url: /settings
  - text: Level 6 1,420 XP
  - progressbar: x
  - button "Sign Out"
- main:
  - heading "Organizer" [level=1]
  - paragraph: Master your tasks, level up your life
  - text: Email
  - textbox "Email":
    - /placeholder: you@example.com
  - text: Password
  - textbox "Password":
    - /placeholder: ••••••••
  - button "Sign In" [disabled]
  - paragraph:
    - text: Don't have an account?
    - link "Sign up":
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
  14 |     await completeBtn.click();
  15 | 
  16 |     // Task should transition to completed state (Mark incomplete button appears)
  17 |     await expect(page.getByLabel("Mark incomplete").first()).toBeVisible();
  18 |   });
  19 | 
  20 |   test("can navigate to tasks page", async ({ page }) => {
  21 |     await page.goto("/");
  22 |     // Click Tasks in sidebar (desktop) or bottom nav
  23 |     await page.getByRole("link", { name: /Tasks/ }).first().click();
> 24 |     await expect(page).toHaveURL("/tasks");
     |                        ^ Error: expect(page).toHaveURL(expected) failed
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