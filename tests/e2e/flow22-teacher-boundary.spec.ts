import { expect, test } from "@playwright/test";
import { loginViaForm } from "./helpers";

/**
 * Flow 22: teacher は staff だが admin ではない。
 *
 * - /admin/inquiries は staff guard なのでアクセスできる
 * - /admin/users と /admin/site/pages は admin-only。teacher は redirect される
 *
 * 既存実装上は `redirect("/")` で公開トップに戻される。
 */
test.describe("Flow 22: teacher role boundary", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "teacher@example.com", "password123");
  });

  test("teacher can reach staff-only admin/inquiries", async ({ page }) => {
    await page.goto("/admin/inquiries");
    await expect(page).toHaveURL(/\/admin\/inquiries/);
    await expect(page.getByText("お問い合わせ管理")).toBeVisible({ timeout: 10000 });
  });

  test("teacher is redirected away from admin-only /admin/users", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForURL((url) => !url.pathname.startsWith("/admin/users"), { timeout: 10000 });
    expect(page.url()).not.toContain("/admin/users");
  });

  test("teacher is redirected away from admin-only /admin/site/pages", async ({ page }) => {
    await page.goto("/admin/site/pages");
    await page.waitForURL((url) => !url.pathname.startsWith("/admin/site/pages"), {
      timeout: 10000,
    });
    expect(page.url()).not.toContain("/admin/site/pages");
  });
});
