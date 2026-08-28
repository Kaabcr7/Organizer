# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: history.spec.ts >> History Page >> shows today in history after tasks exist
- Location: e2e\history.spec.ts:15:7

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
- generic [active] [ref=f1e1]:
  - alert [ref=f1e2]
  - generic [ref=f1e3]:
    - complementary [ref=f1e4]:
      - generic [ref=f1e5]: Organizer
      - navigation [ref=f1e10]:
        - link "Home" [ref=f1e11] [cursor=pointer]:
          - /url: /
        - link "Schedule" [ref=f1e17] [cursor=pointer]:
          - /url: /schedule
        - link "Tasks" [ref=f1e20] [cursor=pointer]:
          - /url: /tasks
        - link "History" [ref=f1e24] [cursor=pointer]:
          - /url: /history
        - link "Stats" [ref=f1e29] [cursor=pointer]:
          - /url: /stats
        - link "Focus" [ref=f1e32] [cursor=pointer]:
          - /url: /focus
        - link "Settings" [ref=f1e37] [cursor=pointer]:
          - /url: /settings
      - generic [ref=f1e41]:
        - generic [ref=f1e42]:
          - generic [ref=f1e43]:
            - generic [ref=f1e44]: Level 6
            - generic [ref=f1e45]: 1,420 XP
          - progressbar [ref=f1e46]: x
        - button "Sign Out" [ref=f1e49]
    - main [ref=f1e53]:
      - generic [ref=f1e57]:
        - generic [ref=f1e58]:
          - heading "Organizer" [level=1] [ref=f1e59]
          - paragraph [ref=f1e60]: Master your tasks, level up your life
        - generic [ref=f1e61]:
          - generic [ref=f1e62]:
            - generic [ref=f1e63]: Email
            - textbox "Email" [ref=f1e64]:
              - /placeholder: you@example.com
          - generic [ref=f1e65]:
            - generic [ref=f1e66]: Password
            - textbox "Password" [ref=f1e67]:
              - /placeholder: ••••••••
          - button "Sign In" [disabled] [ref=f1e68]
          - paragraph [ref=f1e69]:
            - text: Don't have an account?
            - link "Sign up" [ref=f1e70] [cursor=pointer]:
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
  11 |     await expect(page).toHaveURL("/history");
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
> 22 |     await completeBtn.click();
     |                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
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