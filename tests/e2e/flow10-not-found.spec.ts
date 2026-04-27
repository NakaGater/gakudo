import { test, expect } from "@playwright/test";

test.describe("Flow 10: 404 page", () => {
  test("nonexistent page returns 404 and shows the not-found UI", async ({ page }) => {
    // Routing-layer 404: `(public)/[slug]/page.tsx` declares
    // `dynamicParams = false` + `generateStaticParams`, so unknown slugs
    // are rejected by Next's router before any handler runs. That avoids
    // the streaming-SSR issue where notFound() inside a Suspense
    // boundary (loading.tsx) leaves the response status at 200.
    const res = await page.goto("/nonexistent-page-xyz");
    expect(res?.status()).toBe(404);

    // Hydration: the not-found UI from `(public)/not-found.tsx` /
    // `app/not-found.tsx` materializes via Suspense after the initial
    // skeleton — use Playwright's auto-waiting expect().
    await expect(page.getByRole("heading", { name: "ページが見つかりません" }).first()).toBeVisible(
      { timeout: 10000 },
    );
    await expect(page.getByText("404").first()).toBeVisible();
  });
});
