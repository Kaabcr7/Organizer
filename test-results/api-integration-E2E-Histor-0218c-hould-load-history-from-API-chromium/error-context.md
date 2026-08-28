# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api-integration.spec.ts >> E2E: History via API >> should load history from API
- Location: e2e\api-integration.spec.ts:229:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/)

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
  164 |     await expect(page.getByText(/Lv\.|level/i)).toBeVisible({ timeout: 5000 });
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
> 237 |     await expect(page.getByText(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/)).toBeVisible({ timeout: 5000 });
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  238 |   });
  239 | });
  240 | 
```