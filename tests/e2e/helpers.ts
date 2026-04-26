import { type Page } from "@playwright/test";

/**
 * Log in by filling the login form and submitting.
 * After submission, auth cookies are set by the server action.
 * NOTE: The server action redirects to /dashboard which may 404 —
 * the caller should navigate to the desired page after this returns.
 */
export async function loginViaForm(page: Page, email: string, password: string): Promise<void> {
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

const MAILPIT_API = "http://127.0.0.1:54324/api/v1";

type MailpitMessage = {
  ID: string;
  From: { Name: string; Address: string };
  To: { Name: string; Address: string }[];
  Subject: string;
  Created: string;
};

type MailpitMessageDetail = {
  HTML: string;
  Text: string;
};

/**
 * Mailpitから指定アドレス宛の最新メールを取得する。
 * リトライ付きで、メールが届くまで待つ。
 */
export async function getLatestEmail(
  emailAddress: string,
  { timeout = 15000, interval = 1000 } = {},
): Promise<{ id: string; subject: string; html: string; text: string }> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const res = await fetch(
      `${MAILPIT_API}/search?query=${encodeURIComponent(`to:${emailAddress}`)}`,
    );
    const data = await res.json();
    const messages: MailpitMessage[] = data.messages || [];

    const latest = messages.sort(
      (a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime(),
    )[0];
    if (latest) {
      const bodyRes = await fetch(`${MAILPIT_API}/message/${latest.ID}`);
      const body: MailpitMessageDetail = await bodyRes.json();

      return {
        id: latest.ID,
        subject: latest.Subject,
        html: body.HTML,
        text: body.Text,
      };
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`No email received for ${emailAddress} within ${timeout}ms`);
}

/**
 * メール本文からリンクURLを抽出する。
 */
export function extractLinkFromEmail(html: string): string {
  const match = html.match(/href="([^"]*\/auth\/v1\/verify[^"]*)"/);
  if (!match || !match[1]) {
    const anyLink = html.match(/href="(https?:\/\/[^"]*)"/);
    if (!anyLink || !anyLink[1]) throw new Error("No link found in email");
    return anyLink[1];
  }
  return match[1].replace(/&amp;/g, "&");
}

/**
 * Mailpitの全メッセージを削除する。
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function clearMailbox(_emailAddress?: string): Promise<void> {
  await fetch(`${MAILPIT_API}/messages`, { method: "DELETE" });
}
