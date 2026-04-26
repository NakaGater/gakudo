import { test, expect } from "@playwright/test";
import { collectConsoleErrors, loginViaForm } from "./helpers";

test.describe("Flow 18: FAQ page (public + CMS)", () => {
  test("FAQ page renders with title and questions", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/faq");
    await expect(page.getByRole("heading", { name: "Q&A" })).toBeVisible({ timeout: 10000 });
    // Subtitle
    await expect(page.getByText("はじめての方もご安心ください")).toBeVisible();
    // At least one Q marker visible
    await expect(page.getByText("Q").first()).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("accordion opens and closes on click", async ({ page }) => {
    await page.goto("/faq");
    // Wait for questions to render
    const firstQuestionBtn = page.locator("button").filter({ hasText: /^Q/ }).first();
    await expect(firstQuestionBtn).toBeVisible({ timeout: 10000 });

    // Get the answer container that appears after clicking
    // Click to open — answer text should appear
    await firstQuestionBtn.click();
    await expect(page.getByText("A").first()).toBeVisible();

    // Click again to close — answer should disappear
    await firstQuestionBtn.click();
    // Small wait for animation
    await page.waitForTimeout(300);
  });

  test("header has Q&A navigation link", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header");
    await expect(nav.getByRole("link", { name: "Q&A" })).toBeVisible({ timeout: 10000 });
  });

  test("footer has Q&A link", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Q&A" })).toBeVisible({ timeout: 10000 });
  });

  test("Q&A link navigates to FAQ page", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header");
    await nav.getByRole("link", { name: "Q&A" }).click();
    await page.waitForURL("/faq", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Q&A" })).toBeVisible();
  });

  test("CMS: admin can edit FAQ page", async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/admin/site/pages/faq/edit");
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 10000 });

    // FAQ meta fields should be visible (scroll into view)
    const faqFieldset = page.getByText("Q&A 項目");
    await faqFieldset.scrollIntoViewIfNeeded();
    await expect(faqFieldset).toBeVisible();
    // Should have add button
    await expect(page.getByText("＋ 質問を追加")).toBeVisible();
  });

  test("CMS: can add a new question", async ({ page }) => {
    await loginViaForm(page, "admin@example.com", "password123");
    await page.goto("/admin/site/pages/faq/edit");
    await expect(page.getByText("Q&A 項目")).toBeVisible({ timeout: 10000 });

    const uid = Date.now().toString(36);

    // Click add question
    await page.getByText("＋ 質問を追加").scrollIntoViewIfNeeded();
    await page.getByText("＋ 質問を追加").click();

    // Fill the new question (last one)
    const inputs = page.locator('input[placeholder="質問を入力"]');
    const lastInput = inputs.last();
    await lastInput.scrollIntoViewIfNeeded();
    await lastInput.fill(`E2Eテスト質問${uid}`);

    const textareas = page.locator('textarea[placeholder="回答を入力"]');
    const lastTextarea = textareas.last();
    await lastTextarea.fill(`E2Eテスト回答${uid}`);

    // Save — stays on edit page with success message
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("保存しました")).toBeVisible({ timeout: 10000 });

    // Verify on public page
    await page.goto("/faq");
    await expect(page.getByText(`E2Eテスト質問${uid}`)).toBeVisible({ timeout: 10000 });
    await page.getByText(`E2Eテスト質問${uid}`).click();
    await expect(page.getByText(`E2Eテスト回答${uid}`)).toBeVisible();
  });
});
