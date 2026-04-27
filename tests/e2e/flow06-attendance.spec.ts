import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 6: Attendance (US-6)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("attendance page redirects non-entrance users", async ({ page }) => {
    // /attendance (QR scanner) requires entrance role. Non-entrance users
    // are bounced via redirect("/") → middleware (/ → /attendance/status)
    // → /attendance/status sees admin and redirect("/attendance/dashboard").
    // The redirect target path lives UNDER /attendance so we cannot assert
    // "URL no longer starts with /attendance" — instead assert the URL is
    // no longer the QR scanner route itself.
    await page.goto("/attendance");
    await page.waitForURL((url) => url.pathname !== "/attendance", {
      timeout: 10000,
    });
    expect(new URL(page.url()).pathname).not.toBe("/attendance");
  });

  test("attendance history page renders", async ({ page }) => {
    await page.goto("/attendance/history");
    await expect(page.getByRole("heading", { name: "入退室履歴" })).toBeVisible({ timeout: 10000 });
  });

  test("attendance dashboard page renders", async ({ page }) => {
    await page.goto("/attendance/dashboard");
    await expect(page.getByRole("heading", { name: /きょうの\s*ようす/ })).toBeVisible({
      timeout: 10000,
    });
  });

  test("manual attendance page redirects non-entrance users", async ({ page }) => {
    // Same redirect chain as the /attendance test above; admin lands on
    // /attendance/dashboard, not "/" — only assert we left the manual page.
    await page.goto("/attendance/manual");
    await page.waitForURL((url) => url.pathname !== "/attendance/manual", {
      timeout: 10000,
    });
    expect(new URL(page.url()).pathname).not.toBe("/attendance/manual");
  });
});
