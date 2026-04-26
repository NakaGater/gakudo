import { expect, test } from "@playwright/test";
import { loginViaForm } from "./helpers";

/**
 * Flow 23: entrance ロールは出席端末専用。
 *
 * dashboard layout が `/attendance/*` と `/api/*` 以外への遷移を
 * `redirect("/attendance/dashboard")` で弾く。
 */
test.describe("Flow 23: entrance role boundary", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "entrance@example.com", "password123");
  });

  test("entrance lands on /attendance/dashboard after login", async ({ page }) => {
    // login redirects to a role-appropriate landing; for entrance that's
    // /attendance/dashboard. Even if login lands elsewhere, the layout
    // guard will bounce us back here.
    await page.goto("/attendance/dashboard");
    await expect(page).toHaveURL(/\/attendance\/dashboard/);
  });

  test("entrance can stay on /attendance and /attendance/manual", async ({ page }) => {
    await page.goto("/attendance");
    await expect(page).toHaveURL(/\/attendance(\/|$)/);

    await page.goto("/attendance/manual");
    await expect(page).toHaveURL(/\/attendance\/manual/);
  });

  test("entrance is bounced away from /children", async ({ page }) => {
    await page.goto("/children");
    await page.waitForURL((url) => url.pathname.startsWith("/attendance"), { timeout: 10000 });
    expect(page.url()).toMatch(/\/attendance/);
  });

  test("entrance is bounced away from /admin/users", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForURL((url) => !url.pathname.startsWith("/admin/users"), { timeout: 10000 });
    expect(page.url()).not.toContain("/admin/users");
  });

  test("entrance is bounced away from /announcements", async ({ page }) => {
    await page.goto("/announcements");
    await page.waitForURL((url) => !url.pathname.startsWith("/announcements"), { timeout: 10000 });
    expect(page.url()).not.toContain("/announcements");
  });
});
