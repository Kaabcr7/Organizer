# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Home Page >> shows schedule preview
- Location: e2e\home.spec.ts:44:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Schedule' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Schedule' })

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
  3  | test.describe("Home Page", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Clear localStorage to start fresh
  6  |     await page.goto("/");
  7  |     await page.evaluate(() => localStorage.clear());
  8  |     await page.reload();
  9  |   });
  10 | 
  11 |   test("displays greeting and date", async ({ page }) => {
  12 |     await page.goto("/");
  13 |     // Should have a heading with time-based greeting
  14 |     const heading = page.locator("h1");
  15 |     await expect(heading).toBeVisible();
  16 |     const text = await heading.textContent();
  17 |     expect(
  18 |       text?.includes("Good morning") ||
  19 |         text?.includes("Good afternoon") ||
  20 |         text?.includes("Good evening") ||
  21 |         text?.includes("Good night") ||
  22 |         text?.includes("Late night")
  23 |     ).toBe(true);
  24 |   });
  25 | 
  26 |   test("shows daily progress and stats", async ({ page }) => {
  27 |     await page.goto("/");
  28 |     // Should show tasks done count
  29 |     await expect(page.getByText(/tasks done/)).toBeVisible();
  30 |     // Should show streak
  31 |     await expect(page.getByText(/day streak/)).toBeVisible();
  32 |     // Should show level
  33 |     await expect(page.getByText(/Lv\./)).toBeVisible();
  34 |   });
  35 | 
  36 |   test("displays task list", async ({ page }) => {
  37 |     await page.goto("/");
  38 |     await expect(page.getByText("Today's Tasks")).toBeVisible();
  39 |     // Should show mock tasks
  40 |     await expect(page.getByText("Complete OS assignment").first()).toBeVisible();
  41 |     await expect(page.getByText("Solve 2 DSA problems").first()).toBeVisible();
  42 |   });
  43 | 
  44 |   test("shows schedule preview", async ({ page }) => {
  45 |     await page.goto("/");
> 46 |     await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  47 |     await expect(page.getByText("College").first()).toBeVisible();
  48 |   });
  49 | });
  50 | 
```