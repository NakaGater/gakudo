import { expect, test } from "@playwright/test";
import { loginViaForm } from "./helpers";

/**
 * Flow 26: Logout (Server Action) regression.
 *
 * 背景:
 *   旧実装は `supabase.auth.signOut()` をブラウザ側で呼んでから
 *   `window.location = "/"` していたが、Supabase の auth cookie は
 *   サーバ側 (HttpOnly + SameSite) で管理されているためクライアントから
 *   確実にクリアできない。さらに dashboard middleware が認証済みの
 *   ユーザーを `/` から `/attendance/*` にリダイレクトするため、
 *   「ログアウトを押しても何も起きない」(PR #27) や「ログイン画面に
 *   戻ってしまう」(PR #28) というバグが発生していた。
 *
 *   現在は profile/actions.ts の `logout` Server Action が
 *   `await supabase.auth.signOut()` → `redirect("/")` を行い、
 *   sidebar とプロフィール画面の両方で `<form action={logout}>` 経由の
 *   POST に統一している。
 *
 * 検証対象:
 *   1. sidebar (desktop viewport) のログアウトボタンで `/` に戻ること
 *   2. /profile のログアウトボタンで `/` に戻ること
 *   3. ログアウト後に保護領域 `/children` にアクセスすると `/login` に
 *      バウンスされること = auth cookie がサーバ側で確実にクリアされたこと
 */
test.describe("Flow 26: Logout via Server Action", () => {
  test.describe("sidebar logout (desktop)", () => {
    // sidebar は `hidden md:flex` で md (>=768px) 以上でしか表示されない。
    test.use({ viewport: { width: 1280, height: 800 } });

    test("admin: sidebar logout returns to public homepage", async ({ page }) => {
      await loginViaForm(page, "admin@example.com", "password123");
      await page.goto("/attendance/dashboard");

      const logoutButton = page.getByRole("button", { name: "ログアウト" });
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();

      // Server Action は redirect("/") するので公開トップに戻る。
      await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });

      // 認証 cookie が確実にクリアされているなら保護領域は /login に弾かれる。
      await page.goto("/children");
      await page.waitForURL((url) => url.pathname.startsWith("/login"), { timeout: 10000 });
      expect(page.url()).toContain("/login");
    });

    test("parent: sidebar logout returns to public homepage", async ({ page }) => {
      await loginViaForm(page, "parent@example.com", "password123");
      await page.goto("/attendance/status");

      await page.getByRole("button", { name: "ログアウト" }).click();
      await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });

      await page.goto("/attendance/status");
      await page.waitForURL((url) => url.pathname.startsWith("/login"), { timeout: 10000 });
      expect(page.url()).toContain("/login");
    });

    test("teacher: sidebar logout returns to public homepage", async ({ page }) => {
      await loginViaForm(page, "teacher@example.com", "password123");
      await page.goto("/attendance/dashboard");

      await page.getByRole("button", { name: "ログアウト" }).click();
      await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });

      await page.goto("/children");
      await page.waitForURL((url) => url.pathname.startsWith("/login"), { timeout: 10000 });
      expect(page.url()).toContain("/login");
    });

    test("entrance: sidebar logout returns to public homepage", async ({ page }) => {
      // entrance ロールは `/attendance/*` 以外への遷移が dashboard layout で
      // ブロックされる。sidebar 内のログアウトはレイアウトガード対象外
      // (Server Action 自体は `/profile` 配下だが form submit 経由のため
      // layout の redirect 判定を経ない)。
      await loginViaForm(page, "entrance@example.com", "password123");
      await page.goto("/attendance/dashboard");

      await page.getByRole("button", { name: "ログアウト" }).click();
      await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });

      await page.goto("/attendance/dashboard");
      await page.waitForURL((url) => url.pathname.startsWith("/login"), { timeout: 10000 });
      expect(page.url()).toContain("/login");
    });
  });

  test.describe("profile-page logout button", () => {
    // /profile の <LogoutButton /> と sidebar の icon-only ログアウトボタンは
    // どちらも accessible name "ログアウト"（前者は visible text、後者は
    // aria-label 由来）。一方プロフィールのボタンは visible text として
    // "ログアウト" を持ち、sidebar のものはアイコンのみで text content が空。
    // `:has-text()` は text content のみ見るため sidebar とは衝突しない。
    const profileLogoutSelector = 'button[type="submit"]:has-text("ログアウト")';

    test("admin: profile logout returns to public homepage and clears cookies", async ({
      page,
    }) => {
      await loginViaForm(page, "admin@example.com", "password123");
      await page.goto("/profile");

      const submitBtn = page.locator(profileLogoutSelector);
      await expect(submitBtn).toBeVisible();
      await submitBtn.click();

      await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });

      await page.goto("/profile");
      await page.waitForURL((url) => url.pathname.startsWith("/login"), { timeout: 10000 });
      expect(page.url()).toContain("/login");
    });

    test("parent: profile logout returns to public homepage", async ({ page }) => {
      await loginViaForm(page, "parent@example.com", "password123");
      await page.goto("/profile");

      const submitBtn = page.locator(profileLogoutSelector);
      await submitBtn.click();

      await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
    });
  });
});
