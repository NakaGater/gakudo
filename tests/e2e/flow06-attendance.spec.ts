import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 6: Attendance (US-6)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("attendance page redirects non-entrance users", async ({ page }) => {
    // /attendance requires entrance role — admin should be redirected
    await page.goto("/attendance");
    await page.waitForURL((url) => !url.pathname.startsWith("/attendance"), {
      timeout: 10000,
    });
    // Admin is redirected to home
    expect(page.url()).not.toContain("/attendance");
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
    // /attendance/manual requires entrance role — admin should be redirected
    await page.goto("/attendance/manual");
    await page.waitForURL((url) => !url.pathname.startsWith("/attendance/manual"), {
      timeout: 10000,
    });
    expect(page.url()).not.toContain("/attendance/manual");
  });
});
