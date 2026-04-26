import { test, expect } from "@playwright/test";
import { collectConsoleErrors } from "./helpers";

test.describe("Flow 1: Public HP renders (unauthenticated)", () => {
  test("homepage renders facility content", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    // Hero section exists with facility name
    await expect(page.getByText("星ヶ丘こどもクラブ").first()).toBeVisible();
    // Features section heading from seed data
    await expect(page.getByRole("heading", { name: "星ヶ丘こどもクラブの特徴" })).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("homepage shows news section", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "お知らせ" })).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("homepage shows access section", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "アクセス" })).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("/about page renders", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "学童について" })).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("/gallery page renders", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/gallery");
    await expect(page.getByText("フォトギャラリー")).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
