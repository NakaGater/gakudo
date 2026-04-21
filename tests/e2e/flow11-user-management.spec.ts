import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers";

test.describe("Flow 11: User management page (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/admin/users");
    await expect(page.getByText("ユーザー管理")).toBeVisible({ timeout: 10000 });
  });

  test("invite button opens modal and cancel closes it", async ({ page }) => {
    await page.getByRole("button", { name: "ユーザー招待" }).click();

    // Modal has h2 "ユーザー招待"
    await expect(page.locator("h2", { hasText: "ユーザー招待" })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator("select#role")).toBeVisible();

    await page.getByRole("button", { name: "キャンセル" }).click();
    await expect(page.locator('input[name="email"]')).not.toBeVisible();
  });

  test("edit button opens inline edit form", async ({ page }) => {
    const editButtons = page.locator('button[aria-label$="を編集"]');
    await expect(editButtons.first()).toBeVisible();
    await editButtons.first().click();

    await expect(page.locator('select[name="role"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeVisible();

    // Cancel edit via X button in the edit form row
    const editForm = page.locator("form").filter({ has: page.locator('button[type="submit"]', { hasText: "保存" }) });
    await editForm.locator('button[type="button"]').click();
    await expect(page.locator('select[name="role"]')).not.toBeVisible();
  });

  test("delete button opens confirmation dialog", async ({ page }) => {
    const deleteButtons = page.locator('button[aria-label$="を削除"]');
    const count = await deleteButtons.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await deleteButtons.first().click();
    await expect(page.locator("h3", { hasText: "ユーザー削除" })).toBeVisible();
    await expect(page.getByText("を削除しますか")).toBeVisible();

    // Cancel deletion
    await page.getByRole("button", { name: "キャンセル" }).click();
    await expect(page.locator("h3", { hasText: "ユーザー削除" })).not.toBeVisible();
  });
});
