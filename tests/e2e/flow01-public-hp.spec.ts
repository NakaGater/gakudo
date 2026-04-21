import { test, expect } from "@playwright/test";
import { collectConsoleErrors } from "./helpers";

test.describe("Flow 1: Public HP renders (unauthenticated)", () => {
  test("homepage renders facility content", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    // Hero section exists with facility name
    await expect(
      page.getByText("星ヶ丘こどもクラブ").first(),
    ).toBeVisible();
    // Features section heading from seed data
    await expect(
      page.getByRole("heading", { name: "施設の特徴" }),
    ).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("/about page renders", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { name: "学童について" }),
    ).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("/access page renders", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/access");
    await expect(
      page.getByRole("heading", { name: "アクセス" }),
    ).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("/news page renders", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/news");
    await expect(page.getByText("お知らせ一覧")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("/gallery page renders", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/gallery");
    await expect(page.getByText("フォトギャラリー")).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
