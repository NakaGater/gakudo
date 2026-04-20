import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 8: Billing (US-17)", () => {
  test("billing page renders", async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/billing");
    await expect(page.getByText("月次請求一覧")).toBeVisible({
      timeout: 10000,
    });
  });
});
