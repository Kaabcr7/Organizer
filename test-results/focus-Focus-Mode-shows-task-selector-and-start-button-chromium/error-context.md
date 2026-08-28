# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: focus.spec.ts >> Focus Mode >> shows task selector and start button
- Location: e2e\focus.spec.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Select a task to focus on')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Select a task to focus on')

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
  3  | test.describe("Focus Mode", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/focus");
  6  |     await page.evaluate(() => localStorage.clear());
  7  |     await page.reload();
  8  |   });
  9  | 
  10 |   test("shows task selector and start button", async ({ page }) => {
  11 |     await page.goto("/focus");
> 12 |     await expect(page.getByText("Select a task to focus on")).toBeVisible();
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  13 |     await expect(page.getByRole("button", { name: /Start Session/ })).toBeVisible();
  14 |   });
  15 | 
  16 |   test("can start a focus session", async ({ page }) => {
  17 |     await page.goto("/focus");
  18 |     await page.getByRole("button", { name: /Start Session/ }).click();
  19 | 
  20 |     // Should show pause button and timer
  21 |     await expect(page.getByRole("button", { name: /Pause/ })).toBeVisible();
  22 |     await expect(page.getByText("Focusing...")).toBeVisible();
  23 |   });
  24 | 
  25 |   test("can pause and resume", async ({ page }) => {
  26 |     await page.goto("/focus");
  27 |     await page.getByRole("button", { name: /Start Session/ }).click();
  28 | 
  29 |     // Pause
  30 |     await page.getByRole("button", { name: /Pause/ }).click();
  31 |     await expect(page.getByText("Paused")).toBeVisible();
  32 | 
  33 |     // Resume
  34 |     await page.getByRole("button", { name: /Resume/ }).click();
  35 |     await expect(page.getByText("Focusing...")).toBeVisible();
  36 |   });
  37 | });
  38 | 
```