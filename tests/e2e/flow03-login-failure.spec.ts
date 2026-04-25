import { test, expect } from "@playwright/test";

test.describe("Flow 3: Login failure", () => {
  test("shows error with wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("wrong@example.com");
    await page.locator('input[name="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: "ログイン" }).click();

    // Should redirect back to /login with error param and show alert
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("メールアドレスまたはパスワードが正しくありません")).toBeVisible();

    // Should still be on login page
    expect(page.url()).toContain("/login");
  });

  test("shows error with correct email but wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("admin@example.com");
    await page.locator('input[name="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});
