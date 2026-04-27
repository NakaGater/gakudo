import { test, expect } from "@playwright/test";

test.describe("Flow 10: 404 page", () => {
  test("nonexistent page shows the not-found UI without crashing", async ({ page }) => {
    // TODO: assert `res.status() === 404` once the underlying Next 16 +
    // proxy (`src/proxy.ts`) interaction is fixed. Today, the not-found
    // UI is rendered correctly but the response status is 200 because
    // the proxy returns NextResponse.next() with mutated `x-pathname`
    // headers, which appears to lock the status before the route
    // handler's notFound() can override it. Both the
    // VALID_SLUGS-early-notFound() and dynamicParams=false approaches
    // were tried and neither fixes the status. See [slug]/page.tsx
    // VALID_SLUGS comment for context.
    await page.goto("/nonexistent-page-xyz");

    // Page should not be a blank white screen — some content must render.
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    // And it should be the not-found page, not a real article view —
    // the (public)/[slug]/page.tsx VALID_SLUGS guard calls notFound()
    // for unknown slugs which renders Next's default not-found UI.
    // Next's built-in not-found page contains "404" or "could not be
    // found" in English — guard against the route being silently
    // remapped to a real page in the future.
    const lowercased = bodyText.toLowerCase();
    const looksLikeNotFound =
      lowercased.includes("404") ||
      lowercased.includes("not found") ||
      lowercased.includes("could not be found") ||
      bodyText.includes("ページが見つかりません") ||
      bodyText.includes("見つかりません");
    expect(
      looksLikeNotFound,
      `expected /nonexistent-page-xyz to render a not-found page, got body: ${bodyText.slice(0, 200)}`,
    ).toBe(true);
  });
});
