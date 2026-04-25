import { TEXT_LIMITS } from "@/config/constants";

export interface NotificationPreferenceRow {
  user_id: string;
  method: "push" | "email" | "both" | "off";
}

/** push/email/both → push リスト・email リスト、off は除外 */
export function partitionByMethod(prefs: NotificationPreferenceRow[]): {
  pushIds: string[];
  emailIds: string[];
} {
  const pushIds: string[] = [];
  const emailIds: string[] = [];
  for (const p of prefs) {
    if (p.method === "push" || p.method === "both") pushIds.push(p.user_id);
    if (p.method === "email" || p.method === "both") emailIds.push(p.user_id);
  }
  return { pushIds, emailIds };
}

/** 通知本文を NOTIFICATION_BODY_LENGTH で切り詰め、超過時のみ "…" を末尾に付与 */
export function truncateForPush(body: string): string {
  return body.length > TEXT_LIMITS.NOTIFICATION_BODY_LENGTH
    ? body.slice(0, TEXT_LIMITS.NOTIFICATION_BODY_LENGTH) + "…"
    : body;
}

/** push 通知用 JSON ペイロードを生成 (本文は自動で truncate) */
export function buildAnnouncementPayload(
  title: string,
  body: string,
  url: string,
): string {
  return JSON.stringify({ title, body: truncateForPush(body), url });
}

/** ISO timestamp → "HH:mm" (JST) */
export function formatJSTTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 入退室通知のメッセージ群を組み立てる */
export function formatAttendanceMessages(
  childName: string,
  type: "enter" | "exit",
  recordedAtIso: string,
): { pushMessage: string; emailSubject: string; emailBody: string } {
  const jstTime = formatJSTTime(recordedAtIso);
  const actionLabel = type === "enter" ? "入室" : "退室";
  return {
    pushMessage: `${childName}が${actionLabel}しました (${jstTime})`,
    emailSubject: `【星ヶ丘こどもクラブ】${childName}の${actionLabel}通知`,
    emailBody: `${childName}が${jstTime}に${actionLabel}しました。`,
  };
}

/** VAPID キーを env から取得。未設定なら throw。 */
export function getVapidKeys(): { publicKey: string; privateKey: string } {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured");
  }
  return { publicKey, privateKey };
}
