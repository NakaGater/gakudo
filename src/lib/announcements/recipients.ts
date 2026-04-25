/**
 * お知らせの送信対象（recipients）にまつわる型・パース・ラベルのユーティリティ。
 *
 * recipient_type:
 *   - 'all'  : 全保護者
 *   - 'user' : 個別ユーザー（profiles.id）
 */

export const RECIPIENT_AUDIENCES = ["all", "user"] as const;
export type RecipientAudience = (typeof RECIPIENT_AUDIENCES)[number];

export interface RecipientRow {
  recipient_type: RecipientAudience;
  recipient_user_id: string | null;
}

export interface ParsedRecipients {
  audience: RecipientAudience;
  userIds: string[];
}

/** FormData から送信対象を取り出して検証する */
export function parseRecipientsFromFormData(formData: FormData): {
  ok: true;
  value: ParsedRecipients;
} | {
  ok: false;
  message: string;
} {
  const rawAudience = formData.get("audience");
  if (
    typeof rawAudience !== "string"
    || !RECIPIENT_AUDIENCES.includes(rawAudience as RecipientAudience)
  ) {
    return { ok: false, message: "送信対象の指定が不正です" };
  }
  const audience = rawAudience as RecipientAudience;

  if (audience === "all") {
    return { ok: true, value: { audience, userIds: [] } };
  }

  // audience === 'user'
  const userIds: string[] = [];
  for (const v of formData.getAll("userIds")) {
    if (typeof v === "string" && v && !userIds.includes(v)) {
      userIds.push(v);
    }
  }
  if (userIds.length === 0) {
    return { ok: false, message: "送信先のユーザーを1人以上選択してください" };
  }
  return { ok: true, value: { audience, userIds } };
}

/** announcement_recipients に挿入する行を組み立てる */
export function buildRecipientRows(
  announcementId: string,
  parsed: ParsedRecipients,
): Array<{
  announcement_id: string;
  recipient_type: RecipientAudience;
  recipient_user_id: string | null;
}> {
  if (parsed.audience === "all") {
    return [
      {
        announcement_id: announcementId,
        recipient_type: "all",
        recipient_user_id: null,
      },
    ];
  }
  return parsed.userIds.map((uid) => ({
    announcement_id: announcementId,
    recipient_type: "user" as const,
    recipient_user_id: uid,
  }));
}

/** 通知先ユーザーIDを recipient 行から解決する */
export function resolveTargetUserIds(
  rows: RecipientRow[],
  allParentIds: string[],
): string[] {
  const result = new Set<string>();
  let includeAll = false;
  for (const r of rows) {
    if (r.recipient_type === "all") includeAll = true;
    else if (r.recipient_type === "user" && r.recipient_user_id) {
      result.add(r.recipient_user_id);
    }
  }
  if (includeAll) {
    for (const id of allParentIds) result.add(id);
  }
  return [...result];
}

/** UI 表示用のラベル（「全員」「田中花子 他2名」など） */
export function summarizeRecipients(
  rows: RecipientRow[],
  nameByUserId: Map<string, string>,
): string {
  const hasAll = rows.some((r) => r.recipient_type === "all");
  if (hasAll) return "全員";

  const userIds = rows
    .filter((r) => r.recipient_type === "user" && r.recipient_user_id)
    .map((r) => r.recipient_user_id as string);
  if (userIds.length === 0) return "(対象なし)";
  const names = userIds.map((id) => nameByUserId.get(id) ?? "(不明)");
  if (names.length <= 2) return names.join("・");
  return `${names[0]} 他${names.length - 1}名`;
}
