import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 14: Profile management", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("profile page renders with user info", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "プロフィール" })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByText("管理者").first()).toBeVisible();
  });

  test("can update profile name", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 10000 });

    const nameInput = page.locator('input[name="name"]');
    await nameInput.clear();
    await nameInput.fill("管理者テスト");
    await page.getByRole("button", { name: "保存" }).click();

    // Should show success message
    await expect(page.getByText("保存しました")).toBeVisible({ timeout: 10000 });

    // Restore original name
    await nameInput.clear();
    await nameInput.fill("管理者");
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("保存しました")).toBeVisible({ timeout: 10000 });
  });
});
