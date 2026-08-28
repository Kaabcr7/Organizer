# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: history.spec.ts >> History Page >> shows history page with daily record
- Location: e2e\history.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/history"
Received: "http://localhost:3000/auth/login?next=%2Fhistory"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    - locator resolved to <html lang="en" class="dark">…</html>
    - unexpected value "http://localhost:3000/auth/login?next=%2F"
    13 × locator resolved to <html lang="en" class="dark">…</html>
       - unexpected value "http://localhost:3000/auth/login?next=%2Fhistory"

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
  3  | test.describe("History Page", () => {
  4  |   test("shows history page with daily record", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await page.evaluate(() => localStorage.clear());
  7  |     await page.reload();
  8  | 
  9  |     // Navigate to history
  10 |     await page.getByRole("link", { name: /History/ }).first().click();
> 11 |     await expect(page).toHaveURL("/history");
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  12 |     await expect(page.locator("h1")).toContainText("History");
  13 |   });
  14 | 
  15 |   test("shows today in history after tasks exist", async ({ page }) => {
  16 |     await page.goto("/");
  17 |     await page.evaluate(() => localStorage.clear());
  18 |     await page.reload();
  19 | 
  20 |     // Complete a task to generate history
  21 |     const completeBtn = page.getByLabel("Mark complete").first();
  22 |     await completeBtn.click();
  23 | 
  24 |     // Navigate to history
  25 |     await page.getByRole("link", { name: /History/ }).first().click();
  26 |     await expect(page).toHaveURL("/history");
  27 | 
  28 |     // Should show "Today" entry
  29 |     await expect(page.getByText("Today")).toBeVisible();
  30 |   });
  31 | });
  32 | 
```