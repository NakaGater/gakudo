import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 4: Dashboard navigation (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("sidebar has expected nav items", async ({ page }) => {
    // Navigate to a known dashboard page to see the sidebar
    await page.goto("/children");
    await page.waitForLoadState("networkidle");

    // Admin should see all nav items
    const sidebar = page.locator("nav").first();
    await expect(sidebar.getByText("ホーム")).toBeVisible();
    await expect(sidebar.getByText("入退場")).toBeVisible();
    await expect(sidebar.getByText("連絡")).toBeVisible();
    await expect(sidebar.getByText("写真")).toBeVisible();
    await expect(sidebar.getByText("請求")).toBeVisible();
    await expect(sidebar.getByText("児童管理")).toBeVisible();
    await expect(sidebar.getByText("ユーザー")).toBeVisible();
    await expect(sidebar.getByText("HP管理")).toBeVisible();
  });

  test("main nav pages render without error", async ({ page }) => {
    // Each dashboard route renders a page under the (dashboard) route group.
    // Routes are at root level (e.g. /children, /attendance) since (dashboard) is a route group.
    const routes = [
      { path: "/children", marker: "児童一覧" },
      { path: "/attendance", marker: "入退室管理" },
      { path: "/announcements", marker: "お知らせ" },
      { path: "/billing", marker: "月次請求一覧" },
      { path: "/photos", marker: "写真一覧" },
      { path: "/documents", marker: "資料一覧" },
      { path: "/profile", marker: "プロフィール" },
    ];

    for (const { path, marker } of routes) {
      const res = await page.goto(path);
      // Should not get 404 or 500
      expect(res?.status()).toBeLessThan(400);
      await expect(page.getByText(marker).first()).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
