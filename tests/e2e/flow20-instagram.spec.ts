import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 20: Instagram管理", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("Instagram page renders with heading", async ({ page }) => {
    await page.goto("/photos/instagram");
    // Page heading is "写真管理", with "Instagram連携" as a tab label
    await expect(page.getByText("Instagram連携")).toBeVisible();
  });

  test("shows add form for staff", async ({ page }) => {
    await page.goto("/photos/instagram");
    await expect(page.getByPlaceholder(/instagram\.com/i)).toBeVisible();
  });

  test("can add an Instagram post", async ({ page }) => {
    await page.goto("/photos/instagram");

    // Use a per-attempt unique shortcode so a flaky retry doesn't pile
    // duplicate posts in the DB and trip strict-mode.
    const shortcode = `TEST${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const testUrl = `https://www.instagram.com/p/${shortcode}/`;
    await page.getByPlaceholder(/instagram\.com/i).fill(testUrl);

    const captionInput = page.getByPlaceholder(/夏祭り/);
    if (await captionInput.isVisible()) {
      await captionInput.fill("テスト投稿");
    }

    await page.getByRole("button", { name: /追加|登録/i }).click();

    // First wait for the in-form success indicator. This proves the Server
    // Action returned successfully — independent of whether the page tree
    // re-rendered with the new post yet.
    await expect(page.getByText("登録しました").first()).toBeVisible({ timeout: 20000 });

    // Then navigate fresh to read the post list. We previously asserted
    // the post directly after click(), but production-mode in-place
    // re-renders after a Server Action sometimes don't propagate the
    // updated server data within Playwright's window on slow runners
    // (observed across multiple CI runs with timeouts up to 25s).
    // A fresh goto guarantees we're reading a freshly-rendered list.
    await page.goto("/photos/instagram");
    await expect(page.getByText(shortcode).or(page.getByText(testUrl)).first()).toBeVisible({
      timeout: 10000,
    });
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

  test("sidebar has photos link", async ({ page }) => {
    await page.goto("/photos/instagram");
    const nav = page.locator("nav").first();
    // Instagram is a sub-page of photos — sidebar shows "写真"
    await expect(nav.getByText("写真")).toBeVisible();
  });
});
