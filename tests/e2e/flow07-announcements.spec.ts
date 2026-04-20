import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 7: Announcements (US-10)", () => {
  test("announcements page renders", async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/announcements");
    await expect(page.getByText("お知らせ").first()).toBeVisible({
      timeout: 10000,
    });
    // Admin should see "新規作成" button
    await expect(
      page.getByRole("link", { name: "新規作成" }),
    ).toBeVisible();
  });
});
