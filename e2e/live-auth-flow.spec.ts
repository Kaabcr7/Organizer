import { test, expect } from "@playwright/test";

test("DIAGNOSTIC: direct API request to sign-up endpoint", async ({ request }) => {
  const testEmail = `direct-test-${Date.now()}@example.com`;
  console.log("Sending direct request to sign-up endpoint...");
  const start = Date.now();
  const res = await request.post("http://localhost:3000/api/auth/sign-up/email", {
    data: {
      email: testEmail,
      password: "testpass123",
      name: "Direct Test",
    },
    timeout: 15000,
  });
  console.log("Response received after", Date.now() - start, "ms. Status:", res.status());
  const body = await res.text();
  console.log("Body:", body);
});