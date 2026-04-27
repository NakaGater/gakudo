import { test, expect } from "@playwright/test";
import { loginViaForm, getLatestEmail, extractLinkFromEmail, clearMailbox } from "./helpers";

const INVITE_NAME = "E2Eテストユーザー";
const INVITE_PASSWORD = "testpass1234";

test.describe("Flow 13: Invite → set password → login", () => {
  test("admin invites user, user sets password and logs in", async ({ page }) => {
    // This test does login → admin invite (Server Action + Supabase admin
    // createUser + Mailpit handoff) → email link visit → password set →
    // login. End-to-end on a slow CI runner this can exceed the global
    // 30s per-test budget set in playwright.config.ts. test.slow() lifts
    // the budget to 90s so the inner visibility waits actually have a
    // chance to fully play out instead of being killed by the outer
    // timeout (the bug that made flow13 chronically flaky despite each
    // individual `await expect(...)` having generous timeouts).
    test.slow();

    // Generate the invite address INSIDE the test function so each retry
    // sees a fresh, unique email. The previous file-scope `const ... =
    // Date.now()...` was evaluated once at module load and reused across
    // retries, so attempt 1 created the user in Supabase, attempt 2/3 then
    // hit "User already exists", the action errored, and "招待メールを送信
    // しました" never appeared — the test would time out, retry with the
    // same stale email, and fail again.
    const inviteEmail = `e2e-invite-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`;
    await clearMailbox(inviteEmail);

    // 1. Admin logs in
    await loginViaForm(page, "admin@example.com", "password123");

    // 2. Navigate to user management
    await page.goto("/admin/users");
    await expect(page.getByText("ユーザー管理")).toBeVisible({ timeout: 10000 });

    // 3. Open invite form
    await page.getByRole("button", { name: "ユーザー招待" }).click();

    // 4. Fill invite form
    const modal = page.locator(".fixed.inset-0");
    await modal.locator('input[name="email"]').fill(inviteEmail);
    await modal.locator('input[name="name"]').fill(INVITE_NAME);
    await modal.locator("select#role").selectOption("parent");

    // 5. Submit invite
    await modal.getByRole("button", { name: "招待する" }).click();

    // Optimistic UI shows the success banner instantly (see invite-form.tsx).
    await expect(modal.getByText("招待メールを送信しました")).toBeVisible({
      timeout: 5000,
    });

    // We deliberately DON'T wait for the submit button to re-enable here.
    // The invite action does `adminClient.auth.admin.inviteUserByEmail()`
    // which sends an SMTP email to Mailpit; on slow CI runners that
    // round trip is the dominant cost (10-30s). `getLatestEmail` below
    // already polls Mailpit with its own timeout, so it implicitly
    // waits for the action to finish — adding a separate enabled-state
    // wait here just doubles the timeout budget without buying anything.

    // 6. Get invite link from Inbucket. Bump timeout from default 15s
    // → 30s: the invite action's SMTP handoff to Mailpit can take
    // 10-25s on slow CI runners, so by the time the email lands we
    // need a budget that can absorb the worst case.
    const email = await getLatestEmail(inviteEmail, { timeout: 30000 });
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
    await page.locator('input[name="email"]').fill(inviteEmail);
    await page.locator('input[name="password"]').fill(INVITE_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15000,
    });
    expect(page.url()).not.toContain("/login");
  });
});
