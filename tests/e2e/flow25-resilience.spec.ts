import { expect, test } from "@playwright/test";
import { loginViaForm } from "./helpers";

/**
 * Flow 25: resilience — network failures and timeouts should degrade
 * gracefully, not crash the page or hang the UI indefinitely.
 *
 * Two cases:
 *   1. Public news/[id] when the upstream Supabase REST is unreachable.
 *   2. Authenticated dashboard nav when one of the badge-count Supabase
 *      calls fails. The layout still has to render.
 *
 * We intercept the Supabase REST host with `page.route` and return 500.
 * The exact host comes from NEXT_PUBLIC_SUPABASE_URL — Playwright fills
 * it in via `**` glob, so we don't have to read the env at test time.
 */
test.describe("Flow 25: network failure resilience", () => {
  test("public site renders even when Supabase REST returns 500", async ({ page }) => {
    await page.route("**/rest/v1/**", (route) => {
      route.fulfill({ status: 500, body: '{"message":"simulated outage"}' });
    });

    // Public root must not crash. Even if data fetches fail, the shell
    // renders so the user sees *something* instead of a Next error page.
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
  });

  test("dashboard layout still renders when one query fails", async ({ page }) => {
    // Log in cleanly first (network is healthy during login).
    await loginViaForm(page, "admin@example.com", "password123");

    // Now break unrelated REST calls and navigate. The layout must
    // still render the shell — badge count failures shouldn't cascade
    // into a page-level crash.
    await page.route("**/rest/v1/announcement_reads**", (route) => {
      route.fulfill({ status: 500, body: '{"message":"simulated"}' });
    });

    const response = await page.goto("/attendance/dashboard", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(500);
  });
});
