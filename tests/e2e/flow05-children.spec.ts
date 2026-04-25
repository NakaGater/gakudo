import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 5: Children management (US-4, admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("children page renders with action button", async ({ page }) => {
    await page.goto("/children");
    await expect(page.getByText("児童一覧")).toBeVisible({ timeout: 10000 });
    // "新規登録" button should be visible for admin
    await expect(page.getByRole("link", { name: "新規登録" })).toBeVisible();
  });

  test("can create a new child and view detail", async ({ page }) => {
    await page.goto("/children/new");
    await expect(page.getByText("児童 新規登録")).toBeVisible();

    await page.locator('input[name="name"]').fill("テスト太郎");
    await page.locator('select[name="grade"]').selectOption("3");
    await page.getByRole("button", { name: "登録する" }).click();

    // Should redirect to child detail page
    await page.waitForURL(/\/children\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(page.getByText("テスト太郎").first()).toBeVisible();
  });

  test("children list shows created child", async ({ page }) => {
    await page.goto("/children");
    await expect(page.getByText("テスト太郎").first()).toBeVisible({ timeout: 10000 });
  });
});
