import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 7: Announcements (US-10)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("announcements page renders", async ({ page }) => {
    await page.goto("/announcements");
    await expect(page.getByText("お知らせ").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("link", { name: "新規作成" })).toBeVisible();
  });

  test("can create a new announcement", async ({ page }) => {
    await page.goto("/announcements/new");
    await expect(page.getByText("お知らせ作成")).toBeVisible();

    await page.locator('input[name="title"]').fill("E2Eテスト通知");
    await page.locator('textarea[name="body"]').fill("これはE2Eテストのお知らせです。");
    await page.getByRole("button", { name: "投稿する" }).click();

    // Should redirect to announcements list
    await page.waitForURL("/announcements", { timeout: 10000 });
    await expect(page.getByText("E2Eテスト通知").first()).toBeVisible();
  });

  test("can view announcement detail", async ({ page }) => {
    await page.goto("/announcements");
    await page.getByText("E2Eテスト通知").first().click();

    await page.waitForURL(/\/announcements\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "E2Eテスト通知" })).toBeVisible();
    await expect(page.getByText("これはE2Eテストのお知らせです。")).toBeVisible();
    await expect(page.getByText("お知らせ一覧へ戻る")).toBeVisible();
  });
});
