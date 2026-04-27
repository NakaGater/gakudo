import { test, expect } from "@playwright/test";
import { collectConsoleErrors, loginViaForm } from "./helpers";

test.describe("Flow 19: Daily Life page (public + CMS)", () => {
  test("daily-life page renders with title and activities", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/daily-life");
    await expect(page.getByRole("heading", { name: "日々の生活" })).toBeVisible({ timeout: 10000 });
    // Subtitle
    await expect(page.getByText("のびのび、すくすく")).toBeVisible();
    // Activity cards section
    await expect(page.getByRole("heading", { name: "毎日の活動" })).toBeVisible();
    // At least one activity card
    await expect(page.getByText("自由遊び")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("shows activity cards", async ({ page }) => {
    await page.goto("/daily-life");
    await expect(page.getByText("自由遊び")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("学習サポート")).toBeVisible();
    await expect(page.getByText("おやつの時間")).toBeVisible();
  });

  test("shows seasonal events", async ({ page }) => {
    await page.goto("/daily-life");
    await expect(page.getByRole("heading", { name: "季節の行事" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("七夕まつり")).toBeVisible();
    await expect(page.getByText("クリスマス会")).toBeVisible();
  });

  test("shows philosophy section", async ({ page }) => {
    await page.goto("/daily-life");
    await expect(page.getByText("共育ち")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("1人の子どもは、みんなの子ども")).toBeVisible();
  });

  test("header has daily-life navigation link", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header");
    await expect(nav.getByRole("link", { name: "日々の生活" })).toBeVisible({ timeout: 10000 });
  });

  test("nav link navigates to daily-life page", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header");
    await nav.getByRole("link", { name: "日々の生活" }).click();
    await page.waitForURL("/daily-life", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "日々の生活" })).toBeVisible();
  });

  test("CMS: admin can edit daily-life page", async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/admin/site/pages/daily-life/edit");
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 10000 });

    // Activity cards fieldset
    const activityFieldset = page.getByText("活動カード");
    await activityFieldset.scrollIntoViewIfNeeded();
    await expect(activityFieldset).toBeVisible();

    // Events fieldset
    const eventsFieldset = page.getByText("季節の行事");
    await eventsFieldset.scrollIntoViewIfNeeded();
    await expect(eventsFieldset).toBeVisible();

    // Philosophy fieldset
    const philosophyFieldset = page.getByText("理念セクション");
    await philosophyFieldset.scrollIntoViewIfNeeded();
    await expect(philosophyFieldset).toBeVisible();
  });

  test("CMS: can add a new activity", async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/admin/site/pages/daily-life/edit");
    await expect(page.getByText("活動カード")).toBeVisible({ timeout: 10000 });

    const uid = Date.now().toString(36);

    // Click add activity
    await page.getByText("＋ 活動を追加").scrollIntoViewIfNeeded();
    await page.getByText("＋ 活動を追加").click();

    // Fill new activity (last one)
    const titleInputs = page.locator('input[placeholder="活動名"]');
    const lastTitle = titleInputs.last();
    await lastTitle.scrollIntoViewIfNeeded();
    await lastTitle.fill(`E2Eテスト活動${uid}`);

    const descTextareas = page.locator('textarea[placeholder="説明"]');
    const lastDesc = descTextareas.last();
    await lastDesc.fill(`E2Eテスト説明${uid}`);

    // Save — optimistic UI surfaces 保存しました immediately on click,
    // see edit-page-form.tsx for the rationale.
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("保存しました").first()).toBeVisible({ timeout: 5000 });

    // Verify on public page
    await page.goto("/daily-life");
    await expect(page.getByText(`E2Eテスト活動${uid}`)).toBeVisible({ timeout: 10000 });
  });
});
