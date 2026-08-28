# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Navigation >> navigates between all pages
- Location: e2e\navigation.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/schedule"
Received: "http://localhost:3000/auth/login?next=%2Fschedule"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    - locator resolved to <html lang="en" class="dark">…</html>
    - unexpected value "http://localhost:3000/auth/login?next=%2F"
    12 × locator resolved to <html lang="en" class="dark">…</html>
       - unexpected value "http://localhost:3000/auth/login?next=%2Fschedule"

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
  3  | test.describe("Navigation", () => {
  4  |   test("navigates between all pages", async ({ page }) => {
  5  |     await page.goto("/");
  6  | 
  7  |     // Navigate to Schedule
  8  |     await page.getByRole("link", { name: /Schedule/ }).first().click();
> 9  |     await expect(page).toHaveURL("/schedule");
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  10 |     await expect(page.locator("h1")).toContainText("Schedule");
  11 | 
  12 |     // Navigate to Tasks
  13 |     await page.getByRole("link", { name: /Tasks/ }).first().click();
  14 |     await expect(page).toHaveURL("/tasks");
  15 |     await expect(page.locator("h1")).toContainText("Tasks");
  16 | 
  17 |     // Navigate to Stats
  18 |     await page.getByRole("link", { name: /Stats/ }).first().click();
  19 |     await expect(page).toHaveURL("/stats");
  20 |     await expect(page.locator("h1")).toContainText("Statistics");
  21 | 
  22 |     // Navigate to Focus
  23 |     await page.getByRole("link", { name: /Focus/ }).first().click();
  24 |     await expect(page).toHaveURL("/focus");
  25 |     await expect(page.locator("h1")).toContainText("Focus Mode");
  26 | 
  27 |     // Navigate back to Home
  28 |     await page.getByRole("link", { name: /Home/ }).first().click();
  29 |     await expect(page).toHaveURL("/");
  30 |   });
  31 | });
  32 | 
```