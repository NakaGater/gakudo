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

  test("can edit a news article and see the prior version in 修正履歴", async ({ page }) => {
    // Pre-condition: there's at least one news entry from the create
    // test above. Open the list and pick the most recently visible
    // entry (the create test's "E2Eニュース記事" or some pre-existing
    // entry — either is fine for editing).
    await page.goto("/admin/site/news");

    // Click the first 編集 link to drop into the edit page.
    await page.getByRole("link", { name: "編集" }).first().click();
    await page.waitForURL(/\/admin\/site\/news\/[^/]+\/edit/, { timeout: 10000 });

    // Capture the pre-edit body so we can later assert it appears in
    // the 修正履歴 list (the snapshot of the row BEFORE this edit).
    const titleInput = page.locator('input[name="title"]');
    const bodyTextarea = page.locator('textarea[name="body"]');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    const originalTitle = (await titleInput.inputValue()).trim();

    // Make a uniquely-tagged change.
    const uid = Date.now().toString(36);
    const newTitle = `E2E編集後タイトル${uid}`;
    const newBody = `編集後の本文 ${uid}`;
    await titleInput.fill(newTitle);
    await bodyTextarea.fill(newBody);

    const saveButton = page.getByRole("button", { name: "保存" });
    await saveButton.click();

    // Optimistic UI surfaces "保存しました" instantly (see edit-news-form.tsx).
    await expect(page.getByText("保存しました").first()).toBeVisible({ timeout: 5000 });

    // Wait for the action to actually commit before reloading — the
    // submit button is `loading={isPending}`, which Playwright reports
    // as disabled while the action is in flight. Re-enabled = the
    // INSERT into site_news_revisions + the UPDATE on site_news both
    // landed on the server.
    await expect(saveButton).toBeEnabled({ timeout: 15000 });

    // Reload to read the freshly-rendered revisions list (the page
    // does NOT self-revalidate to keep the action response fast).
    await page.reload();

    // 修正履歴 section appears with at least one revision.
    await expect(page.getByRole("heading", { name: /修正履歴/ })).toBeVisible({ timeout: 10000 });

    // Expand the most recent revision and confirm it carries the
    // *pre-edit* title (i.e. the snapshot taken before our save).
    const firstRevision = page.locator("section ol li details").first();
    await firstRevision.locator("summary").click();
    await expect(firstRevision.getByText(originalTitle)).toBeVisible({ timeout: 5000 });
  });
});
