import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 6: Attendance (US-6)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("attendance page renders with scanner", async ({ page }) => {
    await page.goto("/attendance");
    await expect(page.getByText("入退室管理")).toBeVisible({ timeout: 10000 });
    // Check for QR scanner area or manual input
    const hasQR = await page
      .getByText("QRコードを読み取ってください")
      .isVisible()
      .catch(() => false);
    const hasManualInput = await page
      .locator('input[name="qrCode"]')
      .isVisible()
      .catch(() => false);
    expect(hasQR || hasManualInput).toBe(true);
  });

  test("attendance history page renders", async ({ page }) => {
    await page.goto("/attendance/history");
    await expect(
      page.getByRole("heading", { name: "入退室履歴" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("attendance dashboard page renders", async ({ page }) => {
    await page.goto("/attendance/dashboard");
    await expect(
      page.getByRole("heading", { name: /きょうの\s*ようす/ }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("manual attendance page renders", async ({ page }) => {
    await page.goto("/attendance/manual");
    await expect(
      page.getByRole("heading", { name: "手動入力" }),
    ).toBeVisible({ timeout: 10000 });
  });
});
