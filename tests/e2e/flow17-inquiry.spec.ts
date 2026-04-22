import { test, expect } from "@playwright/test";
import { loginViaForm, collectConsoleErrors } from "./helpers";

test.describe("Flow 17: お問い合わせフォーム", () => {
  // テスト毎にユニークな名前を使用（複数回実行しても衝突しない）
  const uniqueId = Date.now().toString(36);

  test("home page shows inquiry form", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");

    // 折りたたみを開く
    await page.locator("details#inquiry summary").click();

    // フォームが表示される
    await expect(page.getByRole("button", { name: /見学予約/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /一般お問い合わせ/ })).toBeVisible();
    await expect(page.getByLabel("お名前")).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("メッセージ")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("visit type shows preferred date field", async ({ page }) => {
    await page.goto("/");
    await page.locator("details#inquiry summary").click();

    // デフォルトは見学予約 → 希望日時が表示
    await expect(page.getByLabel(/見学希望日時/)).toBeVisible();

    // 一般問い合わせに切替 → 希望日時が非表示
    await page.getByRole("button", { name: /一般お問い合わせ/ }).click();
    await expect(page.getByLabel(/見学希望日時/)).not.toBeVisible();
  });

  test("form validates required fields", async ({ page }) => {
    await page.goto("/");
    await page.locator("details#inquiry summary").click();

    // 一般問い合わせに切替（希望日時不要）
    await page.getByRole("button", { name: /一般お問い合わせ/ }).click();

    // 空で送信を試みる（HTML5 validation が効くので name を空にして送信）
    const nameInput = page.getByLabel("お名前");
    await nameInput.fill("");

    // HTML required属性で送信がブロックされることを確認
    const submitBtn = page.getByRole("button", { name: /送信する/ });
    await expect(submitBtn).toBeVisible();
  });

  test("inquiry form submission works (visit type)", async ({ page }) => {
    await page.goto("/");
    await page.locator("details#inquiry summary").click();

    await page.getByLabel("お名前").fill("テスト太郎");
    await page.getByLabel("メールアドレス").fill("test-inquiry@example.com");
    await page.getByLabel(/見学希望日時/).fill("12月20日 15:00");
    await page.getByLabel("メッセージ").fill("見学を希望します。よろしくお願いします。");

    await page.getByRole("button", { name: /送信する/ }).click();

    // 送信完了メッセージ
    await expect(page.getByText("送信完了")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("受け付けました")).toBeVisible();
  });

  test("admin can see inquiry in list", async ({ page }) => {
    const testName = `一覧テスト${uniqueId}`;

    // まず問い合わせを送信
    await page.goto("/");
    await page.locator("details#inquiry summary").click();
    await page.getByRole("button", { name: /一般お問い合わせ/ }).click();
    await page.getByLabel("お名前").fill(testName);
    await page.getByLabel("メールアドレス").fill("list-test@example.com");
    await page.getByLabel("メッセージ").fill("テスト問い合わせです。");
    await page.getByRole("button", { name: /送信する/ }).click();
    await expect(page.getByText("送信完了")).toBeVisible({ timeout: 10000 });

    // 管理者ログイン
    await page.context().clearCookies();
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/admin/inquiries");

    // 問い合わせ一覧に表示される
    await expect(page.getByText(testName).first()).toBeVisible({ timeout: 10000 });
  });

  test("admin can view inquiry detail", async ({ page }) => {
    const testName = `詳細テスト${uniqueId}`;

    // 問い合わせを送信
    await page.goto("/");
    await page.locator("details#inquiry summary").click();
    await page.getByLabel("お名前").fill(testName);
    await page.getByLabel("メールアドレス").fill("detail-test@example.com");
    await page.getByLabel(/見学希望日時/).fill("1月10日 14:00");
    await page.getByLabel("メッセージ").fill("詳細画面のテストです。");
    await page.getByRole("button", { name: /送信する/ }).click();
    await expect(page.getByText("送信完了")).toBeVisible({ timeout: 10000 });

    // 管理者ログイン → 一覧 → 詳細
    await page.context().clearCookies();
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/admin/inquiries");
    await page.getByText(testName).first().click();

    // 詳細ページの内容
    await expect(page.getByText(`${testName} さんからのお問い合わせ`)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("detail-test@example.com")).toBeVisible();
    await expect(page.getByText("1月10日 14:00")).toBeVisible();
    await expect(page.getByText("詳細画面のテストです。")).toBeVisible();

    // 返信ボタンが表示される
    await expect(page.getByRole("button", { name: /承認/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /お断り/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /自由返信/ })).toBeVisible();
  });
});
