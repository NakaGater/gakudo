import { expect, test } from "@playwright/test";
import { loginViaForm } from "./helpers";

/**
 * Flow 24: parent は staff ではない。admin / staff 限定 URL を直叩きしても
 * 自分の画面（保護者ダッシュボード）に redirect される。
 *
 * `isStaff(role)` ガード対象:
 *   /admin/inquiries
 *   /admin/inquiries/[id]
 *
 * `role !== "admin"` ガード対象:
 *   /admin/users
 *   /admin/site/pages
 *
 * いずれも非該当ロールは `redirect("/")` で抜ける。
 */
test.describe("Flow 24: parent role boundary", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "parent@example.com", "password123");
  });

  test("parent reaches their own attendance status page", async ({ page }) => {
    await page.goto("/attendance/status");
    await expect(page).toHaveURL(/\/attendance\/status/);
  });

  test("parent is redirected away from /admin/inquiries", async ({ page }) => {
    await page.goto("/admin/inquiries");
    await page.waitForURL((url) => !url.pathname.startsWith("/admin/inquiries"), {
      timeout: 10000,
    });
    expect(page.url()).not.toContain("/admin/inquiries");
  });

  test("parent is redirected away from /admin/users", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForURL((url) => !url.pathname.startsWith("/admin/users"), { timeout: 10000 });
    expect(page.url()).not.toContain("/admin/users");
  });

  test("parent is redirected away from /admin/site/pages", async ({ page }) => {
    await page.goto("/admin/site/pages");
    await page.waitForURL((url) => !url.pathname.startsWith("/admin/site/pages"), {
      timeout: 10000,
    });
    expect(page.url()).not.toContain("/admin/site/pages");
  });

  test("parent is redirected away from /announcements/new (staff create flow)", async ({
    page,
  }) => {
    await page.goto("/announcements/new");
    await page.waitForURL((url) => !url.pathname.startsWith("/announcements/new"), {
      timeout: 10000,
    });
    expect(page.url()).not.toContain("/announcements/new");
  });
});
