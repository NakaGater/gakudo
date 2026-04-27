import { test, expect } from "@playwright/test";
import { loginViaForm, getLatestEmail, extractLinkFromEmail, clearMailbox } from "./helpers";

const INVITE_EMAIL = `e2e-invite-${Date.now()}@test.com`;
const INVITE_NAME = "E2Eテストユーザー";
const INVITE_PASSWORD = "testpass1234";

test.describe("Flow 13: Invite → set password → login", () => {
  test("admin invites user, user sets password and logs in", async ({ page }) => {
    await clearMailbox(INVITE_EMAIL);

    // 1. Admin logs in
    await loginViaForm(page, "admin@example.com", "password123");

    // 2. Navigate to user management
    await page.goto("/admin/users");
    await expect(page.getByText("ユーザー管理")).toBeVisible({ timeout: 10000 });

    // 3. Open invite form
    await page.getByRole("button", { name: "ユーザー招待" }).click();

    // 4. Fill invite form
    const modal = page.locator(".fixed.inset-0");
    await modal.locator('input[name="email"]').fill(INVITE_EMAIL);
    await modal.locator('input[name="name"]').fill(INVITE_NAME);
    await modal.locator("select#role").selectOption("parent");

    // 5. Submit invite
    await modal.getByRole("button", { name: "招待する" }).click();

    // Wait for success message — bumped from 10s → 20s. The invite Server
    // Action does Supabase admin createUser + Resend/Mailpit handoff and
    // occasionally exceeds 10s under CI runner load (same root cause as
    // flow18/19 which were bumped to 30s for the same reason).
    await expect(modal.getByText("招待メールを送信しました")).toBeVisible({
      timeout: 20000,
    });

    // 6. Get invite link from Inbucket
    const email = await getLatestEmail(INVITE_EMAIL);
    const inviteLink = extractLinkFromEmail(email.html);
    expect(inviteLink).toContain("/auth/v1/verify");

    // 7. Clear admin session by opening new context
    await page.context().clearCookies();

    // 8. Navigate to invite link (Supabase verifies → redirects to /auth/callback → /reset-password)
    await page.goto(inviteLink);
    await expect(page.getByRole("heading", { name: "パスワードを変更" })).toBeVisible({
      timeout: 15000,
    });

    // 9. Set password
    await page.locator('input[name="password"]').fill(INVITE_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(INVITE_PASSWORD);
    await page.getByRole("button", { name: "パスワードを変更" }).click();

    // 10. Should redirect to login
    await page.waitForURL((url) => url.pathname.startsWith("/login"), {
      timeout: 15000,
    });

    // 11. Login with new credentials
    await page.locator('input[name="email"]').fill(INVITE_EMAIL);
    await page.locator('input[name="password"]').fill(INVITE_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15000,
    });
    expect(page.url()).not.toContain("/login");
  });
});
