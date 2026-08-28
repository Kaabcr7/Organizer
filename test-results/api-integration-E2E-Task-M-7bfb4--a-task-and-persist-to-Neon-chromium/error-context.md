# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api-integration.spec.ts >> E2E: Task Management via API >> should create a task and persist to Neon
- Location: e2e\api-integration.spec.ts:18:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button').filter({ hasText: /add|new/i }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]: Organizer
      - navigation [ref=e10]:
        - link "Home" [ref=e11] [cursor=pointer]:
          - /url: /
        - link "Schedule" [ref=e17] [cursor=pointer]:
          - /url: /schedule
        - link "Tasks" [ref=e20] [cursor=pointer]:
          - /url: /tasks
        - link "History" [ref=e24] [cursor=pointer]:
          - /url: /history
        - link "Stats" [ref=e29] [cursor=pointer]:
          - /url: /stats
        - link "Focus" [ref=e32] [cursor=pointer]:
          - /url: /focus
        - link "Settings" [ref=e37] [cursor=pointer]:
          - /url: /settings
      - generic [ref=e41]:
        - generic [ref=e42]:
          - generic [ref=e43]:
            - generic [ref=e44]: Level 6
            - generic [ref=e45]: 1,420 XP
          - progressbar [ref=e46]: x
        - button "Sign Out" [ref=e49]
    - main [ref=e53]:
      - generic [ref=e57]:
        - generic [ref=e58]:
          - heading "Organizer" [level=1] [ref=e59]
          - paragraph [ref=e60]: Master your tasks, level up your life
        - generic [ref=e61]:
          - generic [ref=e62]:
            - generic [ref=e63]: Email
            - textbox "Email" [ref=e64]:
              - /placeholder: you@example.com
          - generic [ref=e65]:
            - generic [ref=e66]: Password
            - textbox "Password" [ref=e67]:
              - /placeholder: ••••••••
          - button "Sign In" [disabled] [ref=e68]
          - paragraph [ref=e69]:
            - text: Don't have an account?
            - link "Sign up" [ref=e70] [cursor=pointer]:
              - /url: /auth/signup
```

# Test source

```ts
  1   | /**
  2   |  * E2E TESTS - API Integration
  3   |  * 
  4   |  * These tests verify the full user flow:
  5   |  * UI → API → Database → Neon
  6   |  * 
  7   |  * Tests verify:
  8   |  * - Task creation persists to Neon
  9   |  * - Task completion calls API and updates XP
  10  |  * - Task undo reverses XP
  11  |  * - Data persists across page refreshes
  12  |  * - Profile data loads from API
  13  |  */
  14  | 
  15  | import { test, expect } from "@playwright/test";
  16  | 
  17  | test.describe("E2E: Task Management via API", () => {
  18  |   test("should create a task and persist to Neon", async ({ page }) => {
  19  |     await page.goto("/");
  20  |     await page.waitForLoadState("networkidle");
  21  | 
  22  |     // Click Add Task button
  23  |     const addTaskBtn = page.getByText(/add.*task|new.*task/i).first();
  24  |     if (await addTaskBtn.isVisible()) {
  25  |       await addTaskBtn.click();
  26  |     } else {
  27  |       // Try to find via aria-label or other attributes
> 28  |       await page.getByRole("button").filter({ hasText: /add|new/i }).first().click();
      |                                                                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
  29  |     }
  30  | 
  31  |     // Fill form
  32  |     await page.getByLabel(/title/i).fill("E2E Test Task");
  33  |     await page.getByLabel(/difficulty/i, { exact: false }).first().click();
  34  |     await page.getByText(/medium/i).first().click();
  35  | 
  36  |     // Submit
  37  |     await page.getByRole("button", { name: /add.*task|create|submit/i }).click();
  38  | 
  39  |     // Wait for API call
  40  |     await page.waitForLoadState("networkidle");
  41  | 
  42  |     // Verify task appears
  43  |     await expect(page.getByText("E2E Test Task")).toBeVisible({ timeout: 5000 });
  44  |   });
  45  | 
  46  |   test("should complete a task and update XP via API", async ({ page }) => {
  47  |     await page.goto("/");
  48  |     await page.waitForLoadState("networkidle");
  49  | 
  50  |     // Get current XP if visible
  51  |     const xpBefore = await page.getByText(/XP|experience/i).first().textContent();
  52  | 
  53  |     // Find first task completion button
  54  |     const completeBtn = page.getByLabel(/mark.*complete|complete/i).first();
  55  |     if (await completeBtn.isVisible()) {
  56  |       await completeBtn.click();
  57  | 
  58  |       // Wait for API call and state update
  59  |       await page.waitForLoadState("networkidle");
  60  | 
  61  |       // Verify task shows as completed
  62  |       const uncompletBtn = page.getByLabel(/mark.*incomplete|undo/i).first();
  63  |       await expect(uncompletBtn).toBeVisible({ timeout: 5000 });
  64  | 
  65  |       // XP should have changed (if visible)
  66  |       const xpAfter = await page.getByText(/XP|experience/i).first().textContent();
  67  |       if (xpBefore && xpAfter) {
  68  |         expect(xpAfter).not.toBe(xpBefore);
  69  |       }
  70  |     }
  71  |   });
  72  | 
  73  |   test("should undo task completion and reverse XP via API", async ({ page }) => {
  74  |     await page.goto("/");
  75  |     await page.waitForLoadState("networkidle");
  76  | 
  77  |     // Find a completed task (mark incomplete button visible)
  78  |     let uncompletBtn = page.getByLabel(/mark.*incomplete|undo/i).first();
  79  |     
  80  |     if (await uncompletBtn.isVisible()) {
  81  |       const xpBefore = await page.getByText(/XP|experience/i).first().textContent();
  82  | 
  83  |       // Click undo
  84  |       await uncompletBtn.click();
  85  | 
  86  |       // Wait for API call
  87  |       await page.waitForLoadState("networkidle");
  88  | 
  89  |       // Verify task is now incomplete
  90  |       const completeBtn = page.getByLabel(/mark.*complete|complete/i).first();
  91  |       await expect(completeBtn).toBeVisible({ timeout: 5000 });
  92  | 
  93  |       // XP should have changed
  94  |       const xpAfter = await page.getByText(/XP|experience/i).first().textContent();
  95  |       if (xpBefore && xpAfter) {
  96  |         expect(xpAfter).not.toBe(xpBefore);
  97  |       }
  98  |     }
  99  |   });
  100 | 
  101 |   test("should persist data across page refresh", async ({ page }) => {
  102 |     await page.goto("/");
  103 |     await page.waitForLoadState("networkidle");
  104 | 
  105 |     // Get visible tasks
  106 |     const tasksBefore = await page.getByRole("button", { name: /mark.*complete|complete/i }).count();
  107 | 
  108 |     // Reload page
  109 |     await page.reload();
  110 |     await page.waitForLoadState("networkidle");
  111 | 
  112 |     // Tasks should reload from API (same count or similar)
  113 |     const tasksAfter = await page.getByRole("button", { name: /mark.*complete|complete/i }).count();
  114 |     expect(tasksAfter).toBeGreaterThanOrEqual(0);
  115 |   });
  116 | 
  117 |   test("should load profile stats from API", async ({ page }) => {
  118 |     await page.goto("/");
  119 |     await page.waitForLoadState("networkidle");
  120 | 
  121 |     // Wait for profile to load
  122 |     await expect(page.getByText(/Lv\.|level/i)).toBeVisible({ timeout: 5000 });
  123 | 
  124 |     // Should show stats (level, XP, etc.)
  125 |     const levelText = await page.getByText(/Lv\.|level/i).first().textContent();
  126 |     expect(levelText).toBeTruthy();
  127 |   });
  128 | 
```