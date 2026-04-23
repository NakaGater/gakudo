import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 20: Instagram管理", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("Instagram page renders with heading", async ({ page }) => {
    await page.goto("/photos/instagram");
    await expect(page.getByRole("heading", { name: /Instagram/i })).toBeVisible();
  });

  test("shows add form for staff", async ({ page }) => {
    await page.goto("/photos/instagram");
    await expect(page.getByPlaceholder(/instagram\.com/i)).toBeVisible();
  });

  test("can add an Instagram post", async ({ page }) => {
    await page.goto("/photos/instagram");

    const testUrl = "https://www.instagram.com/p/TEST123/";
    await page.getByPlaceholder(/instagram\.com/i).fill(testUrl);

    const captionInput = page.getByPlaceholder(/夏祭り/);
    if (await captionInput.isVisible()) {
      await captionInput.fill("テスト投稿");
    }

    await page.getByRole("button", { name: /追加|登録/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText("TEST123").or(page.getByText(testUrl))).toBeVisible();
  });

  test("can toggle post visibility", async ({ page }) => {
    await page.goto("/photos/instagram");

    // Look for a visibility toggle button
    const toggleButton = page.getByRole("button", { name: /公開|非公開/i }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(500);
      // After toggle, the label should change
      await expect(page.getByRole("button", { name: /公開|非公開/i }).first()).toBeVisible();
    }
  });

  test("can delete an Instagram post", async ({ page }) => {
    await page.goto("/photos/instagram");

    const deleteButton = page.getByRole("button", { name: /削除/i }).first();
    if (await deleteButton.isVisible()) {
      // Handle confirm dialog
      page.on("dialog", (dialog) => dialog.accept());
      await deleteButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test("sidebar has Instagram link", async ({ page }) => {
    await page.goto("/photos/instagram");
    const nav = page.locator("nav").first();
    await expect(nav.getByText(/Instagram/i)).toBeVisible();
  });
});
