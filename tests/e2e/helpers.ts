import { expect, type Page } from "@playwright/test";

/**
 * Log in by filling the login form and submitting.
 * After submission, auth cookies are set by the server action.
 * NOTE: The server action redirects to /dashboard which may 404 —
 * the caller should navigate to the desired page after this returns.
 */
export async function loginViaForm(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
  // Wait for navigation away from /login (auth cookies now set)
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15000,
  });
}

/**
 * Collect console errors from page.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}
