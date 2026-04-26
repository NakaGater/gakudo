/**
 * メール送信ユーティリティ
 *
 * - RESEND_API_KEY が設定されている場合: Resend API で送信（本番用）
 * - 未設定の場合: Mailpit HTTP API で送信（ローカル開発用）
 *   → http://127.0.0.1:54324 で送信内容を確認可能
 */

const MAILPIT_API = process.env.MAILPIT_API_URL ?? "http://127.0.0.1:54324/api/v1";

const DEFAULT_FROM =
  process.env.NOTIFICATION_EMAIL_FROM ?? "星ヶ丘こどもクラブ <noreply@yourdomain.com>";

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  from = DEFAULT_FROM,
}: SendEmailParams): Promise<{ id: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    return sendViaResend({ to, subject, text, from }, resendApiKey);
  }

  return sendViaMailpit({ to, subject, text, from });
}

async function sendViaResend(params: SendEmailParams, apiKey: string): Promise<{ id: string }> {
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from: params.from!,
    to: params.to,
    subject: params.subject,
    text: params.text,
  });

  return { id: result.data?.id ?? "unknown" };
}

async function sendViaMailpit(params: SendEmailParams): Promise<{ id: string }> {
  const fromParsed = parseEmailAddress(params.from!);

  const res = await fetch(`${MAILPIT_API}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: { Email: fromParsed.email, Name: fromParsed.name },
      To: [{ Email: params.to, Name: "" }],
      Subject: params.subject,
      Text: params.text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Mailpit send failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  console.log(`[email] Sent via Mailpit → http://127.0.0.1:54324 で確認可能`);
  return { id: data.ID ?? "mailpit" };
}

function parseEmailAddress(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "", email: from };
}
