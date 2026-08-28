# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Home Page >> displays greeting and date
- Location: e2e\home.spec.ts:11:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
> 23 |     ).toBe(true);
     |       ^ Error: expect(received).toBe(expected) // Object.is equality
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
  46 |     await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
  47 |     await expect(page.getByText("College").first()).toBeVisible();
  48 |   });
  49 | });
  50 | 
```