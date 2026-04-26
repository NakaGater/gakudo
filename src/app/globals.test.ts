import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression: iOS Safari auto-zooms the viewport when an `<input>`,
 * `<textarea>` or `<select>` with `font-size < 16px` receives focus —
 * and after a form submit + navigation the zoom can stick on the next
 * page (the "ログイン後に画面が拡大される" symptom).
 *
 * Rather than try to render every page in jsdom and inspect computed
 * styles, we lint globals.css directly: every selector that targets a
 * form input element must declare `font-size >= 16px`.
 *
 * If you add a new input class, list it in INPUT_SELECTORS below.
 */
const CSS_PATH = resolve(__dirname, "globals.css");

// Selectors that style form-input elements. If a future style is added
// (e.g. `.foo-input`), add it here so the regression catches it.
const INPUT_SELECTORS: ReadonlyArray<string> = [
  '.book-cover input[type="email"]',
  '.book-cover input[type="password"]',
  ".warm-input",
  ".search-input",
  ".qr-input input",
  ".profile-input",
];

const MIN_FONT_PX = 16;

/**
 * Read every CSS rule whose selector starts with one of `targetSelectors`
 * and return its declared `font-size` in pixels (numeric), or null if
 * the rule has no font-size.
 */
function extractFontSizesFor(css: string, targetSelectors: readonly string[]): Map<string, number> {
  const result = new Map<string, number>();
  // Strip /* ... */ comments first so they don't get glued onto the
  // selector preceding the next `{`.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  // Match a rule: `selector1, selector2 { ... }` (no nested braces — fine
  // for our flat globals.css).
  const ruleRe = /([^{}]+)\{([^{}]+)\}/g;
  for (const match of stripped.matchAll(ruleRe)) {
    const selectorList = match[1]!.split(",").map((s) => s.trim().replace(/\s+/g, " "));
    const body = match[2]!;
    const fontSizeMatch = body.match(/font-size:\s*([\d.]+)px\b/);
    if (!fontSizeMatch) continue;
    const px = Number(fontSizeMatch[1]);
    for (const sel of selectorList) {
      if (targetSelectors.includes(sel)) {
        // If the selector appears in multiple rules, the LAST one wins
        // in CSS source order — keep the latest.
        result.set(sel, px);
      }
    }
  }
  return result;
}

describe("input font-size (iOS Safari auto-zoom regression)", () => {
  const css = readFileSync(CSS_PATH, "utf-8");
  const sizes = extractFontSizesFor(css, INPUT_SELECTORS);

  for (const selector of INPUT_SELECTORS) {
    it(`${selector} declares font-size >= ${MIN_FONT_PX}px`, () => {
      const px = sizes.get(selector);
      // Every listed selector should appear in globals.css. If not, the
      // test list is stale (selector was renamed/removed) — fix the
      // list, don't lower the bar.
      expect(px, `selector ${selector} not found in globals.css`).toBeDefined();
      expect(px!).toBeGreaterThanOrEqual(MIN_FONT_PX);
    });
  }
});

/**
 * Regression: the public layout's `<div class="book-page mx-auto … w-full">`
 * sets `width: 100%`. Combined with a non-zero horizontal margin, the
 * element's outer width exceeds the parent's content area by `2 ×
 * margin`. The parent has `overflow: hidden`, so only the right side
 * gets clipped — the user sees the page shifted right with very
 * little right padding ("公開ページが全体的に右寄り" symptom).
 *
 * The mobile breakpoint used to be `margin: 8px` (all four sides) which
 * caused 16px of horizontal overflow. The fix is `margin: 8px 0` —
 * vertical breathing room only.
 *
 * This test parses the @media block and asserts the horizontal margin
 * stays 0 even if a future "let's add some breathing room" change
 * resurrects the shorthand.
 */
describe(".book-page mobile margin (horizontal overflow regression)", () => {
  const css = readFileSync(CSS_PATH, "utf-8");

  // Strip /* ... */ comments before regex-matching declarations —
  // otherwise text like `margin: 8px` *inside a comment* (e.g. one
  // explaining why the rule was changed) gets parsed as the actual
  // declaration.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");

  it("uses vertical-only margin so width:100% + margin doesn't overflow", () => {
    const mediaBlock = stripped.match(
      /@media \(max-width:\s*768px\)\s*\{[\s\S]*?\.book-page\s*\{([^}]*)\}/,
    );
    expect(mediaBlock, "expected a mobile @media block with a .book-page rule").not.toBeNull();

    const body = mediaBlock![1]!;
    const marginDecl = body.match(/margin:\s*([^;]+);/);
    expect(marginDecl, ".book-page mobile rule must declare a margin").not.toBeNull();

    const value = marginDecl![1]!.trim();
    // Acceptable: `8px 0`, `8px 0 8px 0`, `0`, `0 0`. Forbidden: any
    // single-value shorthand like `8px` (sets all sides) — that's the
    // original bug. Also forbidden: any 4-value form whose 2nd or 4th
    // value is non-zero (those are the right and left margins).
    const tokens = value.split(/\s+/);
    let horizontal: string;
    if (tokens.length === 1) {
      horizontal = tokens[0]!; // e.g. "8px" → fails (non-zero applies to LR too)
    } else if (tokens.length === 2 || tokens.length === 3) {
      horizontal = tokens[1]!; // 2 or 3 values: 2nd is left+right
    } else {
      // 4 values: top right bottom left — both right (1) and left (3) must be 0
      const right = tokens[1]!;
      const left = tokens[3]!;
      expect(right, "right margin must be 0").toMatch(/^0(px)?$/);
      expect(left, "left margin must be 0").toMatch(/^0(px)?$/);
      return;
    }
    expect(
      horizontal,
      `horizontal margin must be 0 (got ${value}); width:100% + margin > 0 overflows the parent`,
    ).toMatch(/^0(px)?$/);
  });
});
