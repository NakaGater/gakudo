import { test, expect } from "@playwright/test";
import { collectConsoleErrors } from "./helpers";

test.describe("Flow 1: Public HP renders (unauthenticated)", () => {
  test("homepage renders facility content", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(
      page.getByText("星ヶ丘こどもクラブ").first(),
    ).toBeVisible();
    await expect(
      page.getByText("子どもたちの笑顔あふれる放課後を"),
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
