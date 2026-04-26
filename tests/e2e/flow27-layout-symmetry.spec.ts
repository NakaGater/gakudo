import { expect, test } from "@playwright/test";

/**
 * Flow 27: 公開ページの左右対称レイアウト regression。
 *
 * 背景 (PR #30):
 *   `(public)/layout.tsx` の `<div class="book-page mx-auto ... w-full">`
 *   が `width: 100%` を持っており、`@media (max-width: 768px)` で
 *   `.book-page { margin: 8px; }` (4 辺すべて 8px) が当たっていた時代は
 *   外形幅が「親の content area + 16px」になり、親の `overflow: hidden`
 *   で右側だけ切り落とされて見た目が右寄りになっていた。
 *   修正は `margin: 8px 0` (上下のみ)。
 *
 *   この E2E は「将来 `margin: 8px` に戻されると左右の余白が崩れる」
 *   ことを bounding box ベースで検出する。CSS の lint (globals.test.ts)
 *   は文字列パースで防ぐが、ここではブラウザに実際に rendering させて
 *   左右ギャップの対称性を確認する二重防御。
 */

const PUBLIC_PAGES = [
  { path: "/", label: "ホーム" },
  { path: "/about", label: "施設紹介" },
  { path: "/daily-life", label: "日々の生活" },
  { path: "/enrollment", label: "入所案内" },
  { path: "/faq", label: "Q&A" },
  { path: "/gallery", label: "ギャラリー" },
] as const;

// iPhone 14 Pro 程度のモバイル幅。768px 未満なら同じバグが再現する。
const MOBILE_VIEWPORT = { width: 390, height: 844 };

// 1px の rounding は許容 (sub-pixel layout)。
const PIXEL_TOLERANCE = 1;

test.describe("Flow 27: Public page layout symmetry (mobile)", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const { path, label } of PUBLIC_PAGES) {
    test(`${label} (${path}): book-page is horizontally centered`, async ({ page }) => {
      await page.goto(path);

      // book-page が表示されるまで待つ。
      const bookPage = page.locator(".book-page").first();
      await expect(bookPage).toBeVisible();

      const measurements = await page.evaluate(() => {
        const el = document.querySelector(".book-page");
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          viewportWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          documentClientWidth: document.documentElement.clientWidth,
        };
      });

      expect(measurements, "book-page element must exist").not.toBeNull();
      const m = measurements!;

      const leftGap = m.left;
      const rightGap = m.viewportWidth - m.right;

      // 1. 左右ギャップが対称: width:100% + 横方向 margin > 0 で
      //    親をはみ出して overflow:hidden で右だけ切られる症状を検出。
      expect(
        Math.abs(leftGap - rightGap),
        `${path}: leftGap=${leftGap} vs rightGap=${rightGap} — book-page is not horizontally centered`,
      ).toBeLessThanOrEqual(PIXEL_TOLERANCE);

      // 2. ドキュメントの横スクロールが発生していない。
      //    .book-page が viewport を超えると documentScrollWidth >
      //    clientWidth になり、ユーザーは横スワイプでさらにコンテンツが
      //    覗ける状態になってしまう。
      expect(
        m.documentScrollWidth,
        `${path}: horizontal overflow detected (scrollWidth=${m.documentScrollWidth} > clientWidth=${m.documentClientWidth})`,
      ).toBeLessThanOrEqual(m.documentClientWidth + PIXEL_TOLERANCE);

      // 3. book-page 自身が viewport をはみ出していない。
      expect(
        m.right,
        `${path}: book-page right edge (${m.right}) exceeds viewport width (${m.viewportWidth})`,
      ).toBeLessThanOrEqual(m.viewportWidth + PIXEL_TOLERANCE);
      expect(m.left, `${path}: book-page left edge (${m.left}) is negative`).toBeGreaterThanOrEqual(
        -PIXEL_TOLERANCE,
      );
    });
  }
});
