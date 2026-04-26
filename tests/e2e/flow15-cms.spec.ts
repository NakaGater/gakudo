import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 15: CMS / HP management (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
  });

  test("site pages list renders", async ({ page }) => {
    await page.goto("/admin/site/pages");
    await expect(page.getByRole("heading", { name: "HP管理" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("ページ管理")).toBeVisible();
    await expect(page.getByText("編集").first()).toBeVisible();
  });

  test("can navigate to page editor", async ({ page }) => {
    await page.goto("/admin/site/pages");
    await expect(page.getByRole("heading", { name: "HP管理" })).toBeVisible({ timeout: 10000 });

    // Click first edit link
    await page.getByText("編集").first().click();
    await page.waitForURL(/\/admin\/site\/pages\/[^/]+\/edit/, { timeout: 10000 });

    // Should show edit form with title input
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeVisible();
  });

  test("site news list renders", async ({ page }) => {
    await page.goto("/admin/site/news");
    await expect(page.getByText("お知らせ管理")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: "新規作成" })).toBeVisible();
  });

  test("can create a news article", async ({ page }) => {
    await page.goto("/admin/site/news/new");
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 10000 });

    await page.locator('input[name="title"]').fill("E2Eニュース記事");
    await page.locator('textarea[name="body"]').fill("テスト用のニュース記事です。");
    await page.getByRole("button", { name: "作成する" }).click();

    // Should redirect to news list
    await page.waitForURL("/admin/site/news", { timeout: 10000 });
    await expect(page.getByText("E2Eニュース記事").first()).toBeVisible();
  });

  test("public home page shows created article", async ({ page, context }) => {
    // beforeEach logs in as admin; middleware bounces authenticated visitors
    // from "/" to "/attendance/status". To verify the article actually
    // surfaces on the *public* homepage we drop the auth cookies first so
    // we look at the page as an anonymous visitor would.
    await context.clearCookies();
    await page.goto("/");
    await expect(page.getByText("E2Eニュース記事").first()).toBeVisible({ timeout: 10000 });
  });
});
