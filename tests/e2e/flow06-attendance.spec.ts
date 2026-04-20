import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 6: Attendance page (US-6)", () => {
  test("attendance page renders", async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
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
    // At least one attendance UI element should be present
    expect(hasQR || hasManualInput).toBe(true);
  });
});
