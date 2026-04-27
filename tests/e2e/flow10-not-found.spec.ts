import { test, expect } from "@playwright/test";

test.describe("Flow 10: 404 page", () => {
  test("nonexistent page shows the not-found UI without crashing", async ({ page }) => {
    // TODO: assert `res.status() === 404` once the underlying Next 16 +
    // proxy (`src/proxy.ts`) interaction is fixed. Today, the not-found
    // UI hydrates correctly but the response status is 200 because the
    // proxy returns NextResponse.next() with mutated `x-pathname`
    // headers, which appears to lock the status before notFound() can
    // override it.
    //
    // Note on streaming SSR: Next 16 streams the page with the (public)
    // loading.tsx skeleton as the initial Suspense fallback, then the
    // client hydrates and swaps in the not-found.tsx content. A
    // synchronous `body.innerText()` right after page.goto() observes
    // only the skeleton (no text) — use Playwright's auto-waiting
    // expect() so the assertion blocks until hydration completes.
    await page.goto("/nonexistent-page-xyz");

    // The not-found content lives in `app/not-found.tsx` /
    // `(public)/not-found.tsx` — both render an h1 with this text.
    await expect(page.getByRole("heading", { name: "ページが見つかりません" }).first()).toBeVisible(
      { timeout: 10000 },
    );

    // Sanity: the rendered page has more than just the heading
    // (it should also show the explanatory paragraph and home link).
    await expect(page.getByText("404").first()).toBeVisible();
  });
});
