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
