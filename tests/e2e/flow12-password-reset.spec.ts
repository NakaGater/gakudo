import { test, expect } from "@playwright/test";
import { getLatestEmail, extractLinkFromEmail, clearMailbox } from "./helpers";

const TEST_EMAIL = "admin@example.com";
const ORIGINAL_PASSWORD = "password123";
const NEW_PASSWORD = "newpass9999";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

async function adminResetPassword(email: string, newPassword: string) {
  // Get user by email
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  });
  const { users } = await listRes.json();
  const user = users.find((u: { email: string }) => u.email === email);
  if (!user) throw new Error(`User ${email} not found`);

  // Update password via admin API
  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!updateRes.ok) throw new Error(`Failed to reset password: ${updateRes.status}`);
}

test.describe("Flow 12: Password reset (PKCE)", () => {
  test.beforeAll(async () => {
    await clearMailbox();
  });

  test.afterAll(async () => {
    // Restore original password via admin API
    await adminResetPassword(TEST_EMAIL, ORIGINAL_PASSWORD);
  });

  test("forgot password → reset → login with new password", async ({ page, context }) => {
    // 1. Go to forgot-password page
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "パスワードをお忘れですか" })).toBeVisible();

    // 2. Request password reset
    await page.locator('input[name="email"]').fill(TEST_EMAIL);
    await page.getByRole("button", { name: "送信" }).click();

    await expect(page.getByText("メール送信完了")).toBeVisible({
      timeout: 10000,
    });

    // 3. Get reset link from Mailpit
    const email = await getLatestEmail(TEST_EMAIL);
    const resetLink = extractLinkFromEmail(email.html);
    expect(resetLink).toContain("/auth/v1/verify");

    // 4. Navigate to the reset link (Supabase verifies → /auth/callback?code=... → /reset-password)
    await page.goto(resetLink);
    await expect(page.getByRole("heading", { name: "パスワードを変更" })).toBeVisible({
      timeout: 15000,
    });

    // 5. Set new password
    await page.locator('input[name="password"]').fill(NEW_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "パスワードを変更" }).click();

    // 6. Should navigate away from /reset-password (may go to /login or dashboard)
    await page.waitForURL((url) => !url.pathname.startsWith("/reset-password"), {
      timeout: 30000,
    });

    // 7. Clear cookies and verify login with new password
    await context.clearCookies();
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(TEST_EMAIL);
    await page.locator('input[name="password"]').fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15000,
    });
    expect(page.url()).not.toContain("/login");
  });
});
