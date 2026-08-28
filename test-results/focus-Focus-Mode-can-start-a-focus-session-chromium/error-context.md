# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: focus.spec.ts >> Focus Mode >> can start a focus session
- Location: e2e\focus.spec.ts:16:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Start Session/ })

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
  3  | test.describe("Focus Mode", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/focus");
  6  |     await page.evaluate(() => localStorage.clear());
  7  |     await page.reload();
  8  |   });
  9  | 
  10 |   test("shows task selector and start button", async ({ page }) => {
  11 |     await page.goto("/focus");
  12 |     await expect(page.getByText("Select a task to focus on")).toBeVisible();
  13 |     await expect(page.getByRole("button", { name: /Start Session/ })).toBeVisible();
  14 |   });
  15 | 
  16 |   test("can start a focus session", async ({ page }) => {
  17 |     await page.goto("/focus");
> 18 |     await page.getByRole("button", { name: /Start Session/ }).click();
     |                                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
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