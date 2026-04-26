import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 8: Billing (US-17)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("billing page renders", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByText("月次請求一覧")).toBeVisible({
      timeout: 10000,
    });
  });

  test("billing rules page renders", async ({ page }) => {
    await page.goto("/billing/rules");
    await expect(page.getByRole("heading", { name: "料金ルール" })).toBeVisible({ timeout: 10000 });
  });
});
