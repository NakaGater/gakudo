import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 5: Children list (US-4, admin view)", () => {
  test("children page renders with action button", async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/children");
    await expect(page.getByText("児童一覧")).toBeVisible({ timeout: 10000 });
    // "新規登録" button should be visible for admin
    await expect(
      page.getByRole("link", { name: "新規登録" }),
    ).toBeVisible();
  });
});
