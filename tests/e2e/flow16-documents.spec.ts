import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 16: Documents management", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("documents page renders with heading", async ({ page }) => {
    await page.goto("/documents");
    await expect(
      page.getByRole("heading", { name: "資料一覧" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("documents page shows upload section for staff", async ({ page }) => {
    await page.goto("/documents");
    await expect(page.getByText("資料一覧")).toBeVisible({ timeout: 10000 });
    // Admin should see upload functionality
    await expect(
      page.getByText("アップロード").or(page.getByText("ファイルを選択")),
    ).toBeVisible();
  });
});
