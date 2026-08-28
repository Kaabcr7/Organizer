# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api-integration.spec.ts >> E2E: Task Management via API >> should not use localStorage as authoritative source
- Location: e2e\api-integration.spec.ts:152:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Lv\.|level/i)
Expected: visible
Error: strict mode violation: getByText(/Lv\.|level/i) resolved to 2 elements:
    1) <span class="text-sm font-semibold">Level 6</span> aka getByText('Level 6')
    2) <p class="text-slate-400 text-sm mt-2">Master your tasks, level up your life</p> aka getByText('Master your tasks, level up')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Lv\.|level/i)

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
  129 |   test("should handle API errors gracefully", async ({ page }) => {
  130 |     // Go to home page
  131 |     await page.goto("/");
  132 | 
  133 |     // Simulate network error by going offline
  134 |     await page.context().setOffline(true);
  135 | 
  136 |     // Try to complete task - should show error or fallback
  137 |     const completeBtn = page.getByLabel(/mark.*complete|complete/i).first();
  138 |     if (await completeBtn.isVisible()) {
  139 |       await completeBtn.click();
  140 |       
  141 |       // Wait a bit for error handling
  142 |       await page.waitForTimeout(1000);
  143 | 
  144 |       // App should still be usable (not crash)
  145 |       await expect(page.locator("body")).toBeVisible();
  146 |     }
  147 | 
  148 |     // Go back online
  149 |     await page.context().setOffline(false);
  150 |   });
  151 | 
  152 |   test("should not use localStorage as authoritative source", async ({ page }) => {
  153 |     await page.goto("/");
  154 |     await page.waitForLoadState("networkidle");
  155 | 
  156 |     // Clear localStorage manually
  157 |     await page.evaluate(() => localStorage.clear());
  158 | 
  159 |     // Reload - data should still appear from API, not localStorage
  160 |     await page.reload();
  161 |     await page.waitForLoadState("networkidle");
  162 | 
  163 |     // Profile should still load
> 164 |     await expect(page.getByText(/Lv\.|level/i)).toBeVisible({ timeout: 5000 });
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  165 |   });
  166 | });
  167 | 
  168 | test.describe("E2E: Task Editing via API", () => {
  169 |   test("should edit a task and persist to Neon", async ({ page }) => {
  170 |     await page.goto("/tasks");
  171 |     await page.waitForLoadState("networkidle");
  172 | 
  173 |     // Click edit on first task if visible
  174 |     const editBtn = page.getByLabel(/edit/i).first();
  175 |     if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  176 |       await editBtn.click();
  177 | 
  178 |       // Dialog should appear
  179 |       await expect(page.getByText(/edit.*task|update/i)).toBeVisible({ timeout: 5000 });
  180 | 
  181 |       // Modify title
  182 |       const titleInput = page.getByLabel(/title/i).first();
  183 |       await titleInput.clear();
  184 |       await titleInput.fill("Updated Task Title");
  185 | 
  186 |       // Submit
  187 |       await page.getByRole("button", { name: /save|update|done/i }).click();
  188 | 
  189 |       // Wait for API call
  190 |       await page.waitForLoadState("networkidle");
  191 | 
  192 |       // Verify updated title appears
  193 |       await expect(page.getByText("Updated Task Title")).toBeVisible({ timeout: 5000 });
  194 |     }
  195 |   });
  196 | 
  197 |   test("should delete a task and persist to Neon", async ({ page }) => {
  198 |     await page.goto("/tasks");
  199 |     await page.waitForLoadState("networkidle");
  200 | 
  201 |     // Count tasks before
  202 |     const taskCountBefore = await page.getByRole("button", { name: /delete|remove/i }).count();
  203 | 
  204 |     // Click delete on first task if visible
  205 |     const deleteBtn = page.getByRole("button", { name: /delete|remove/i }).first();
  206 |     if (taskCountBefore > 0) {
  207 |       // Get task title to verify deletion
  208 |       const taskText = await deleteBtn.locator("..").textContent();
  209 | 
  210 |       await deleteBtn.click();
  211 | 
  212 |       // Confirm deletion if dialog appears
  213 |       const confirmBtn = page.getByRole("button", { name: /confirm|yes|delete/i });
  214 |       if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  215 |         await confirmBtn.click();
  216 |       }
  217 | 
  218 |       // Wait for API call
  219 |       await page.waitForLoadState("networkidle");
  220 | 
  221 |       // Task count should decrease or task should not appear
  222 |       const taskCountAfter = await page.getByRole("button", { name: /delete|remove/i }).count();
  223 |       expect(taskCountAfter).toBeLessThanOrEqual(taskCountBefore);
  224 |     }
  225 |   });
  226 | });
  227 | 
  228 | test.describe("E2E: History via API", () => {
  229 |   test("should load history from API", async ({ page }) => {
  230 |     await page.goto("/history");
  231 |     await page.waitForLoadState("networkidle");
  232 | 
  233 |     // Should show history heading
  234 |     await expect(page.getByText(/history|past/i)).toBeVisible({ timeout: 5000 });
  235 | 
  236 |     // Should show some date or summary
  237 |     await expect(page.getByText(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/)).toBeVisible({ timeout: 5000 });
  238 |   });
  239 | });
  240 | 
```