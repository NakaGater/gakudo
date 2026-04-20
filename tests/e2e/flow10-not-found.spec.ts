import { test, expect } from "@playwright/test";

test.describe("Flow 10: 404 page", () => {
  test("nonexistent page shows 404 without crashing", async ({ page }) => {
    const res = await page.goto("/nonexistent-page-xyz");
    // Should return 404 status
    expect(res?.status()).toBe(404);
    // Page should not show a blank white screen — some content should render
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
