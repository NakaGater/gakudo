import webpush from "web-push";
import { resolveTargetUserIds, type RecipientRow } from "@/lib/announcements/recipients";
import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  partitionByMethod,
  buildAnnouncementPayload,
  formatAttendanceMessages,
  getVapidKeys,
  type NotificationPreferenceRow,
} from "./send.helpers";

interface PushSubscriptionRow {
  user_id: string;
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
}

interface ProfileRow {
  id: string;
  email: string;
}

export async function sendAnnouncementNotification(
  announcementId: string,
  title: string,
  body: string,
): Promise<void> {
  const supabase = createAdminClient();

  // 1) このお知らせの送信対象を解決する
  const { data: recipients, error: recipientsError } = await supabase
    .from("announcement_recipients")
    .select("recipient_type, recipient_user_id")
    .eq("announcement_id", announcementId);

  if (recipientsError) {
    console.error("[notifications] Failed to fetch recipients:", recipientsError.message);
    return;
  }

  const rows = (recipients ?? []) as RecipientRow[];
  if (rows.length === 0) return;

  const includesAll = rows.some((r) => r.recipient_type === "all");

  // 'all' の場合は全保護者を、それ以外は指名されたユーザーのみを対象に
  let targetUserIds: string[];
  if (includesAll) {
    const { data: parents, error: parentsError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "parent");
    if (parentsError || !parents) {
      console.error("[notifications] Failed to fetch parents:", parentsError?.message);
      return;
    }
    targetUserIds = resolveTargetUserIds(
      rows,
      (parents as { id: string }[]).map((p) => p.id),
    );
  } else {
    targetUserIds = resolveTargetUserIds(rows, []);
  }

  if (targetUserIds.length === 0) return;

  // 2) 対象ユーザーの通知設定を取得し、push/email 別に振り分け
  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("user_id, method")
    .in("user_id", targetUserIds)
    .in("method", ["push", "email", "both"]);

  if (prefsError || !prefs || (prefs as NotificationPreferenceRow[]).length === 0) {
    if (prefsError) {
      console.error("[notifications] Failed to fetch preferences:", prefsError.message);
    }
    return;
  }

  const { pushIds, emailIds } = partitionByMethod(prefs as NotificationPreferenceRow[]);

  if (pushIds.length > 0) {
    const payload = buildAnnouncementPayload(title, body, `/announcements/${announcementId}`);
    await sendPushNotifications(supabase, pushIds, payload);
  }

  if (emailIds.length > 0) {
    await sendEmailNotifications(supabase, emailIds, `【星ヶ丘こどもクラブ】${title}`, body);
  }
}

async function sendPushNotifications(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[],
  payload: string,
): Promise<void> {
  let vapidKeys: { publicKey: string; privateKey: string };
  try {
    vapidKeys = getVapidKeys();
  } catch (error) {
    console.error("[notifications] VAPID keys not configured, skipping push:", error);
    return;
  }

  webpush.setVapidDetails(
    "mailto:noreply@yourdomain.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey,
  );

  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("user_id, subscription")
    .in("user_id", userIds);

  if (subsError || !subs) {
    console.error("[notifications] Failed to fetch push subscriptions:", subsError?.message);
    return;
  }

  const rows = subs as PushSubscriptionRow[];
  const results = await Promise.allSettled(
    rows.map((row) => webpush.sendNotification(row.subscription, payload)),
  );
  let failures = 0;
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      failures += 1;
      const reason = result.reason;
      console.error(
        `[notifications] Push failed for user ${rows[i].user_id}:`,
        reason instanceof Error ? reason.message : reason,
      );
    }
  });
  if (failures > 0) {
    console.error(
      `[notifications] Push fan-out: ${rows.length - failures}/${rows.length} delivered, ${failures} failed`,
    );
  }
}

async function sendEmailNotifications(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[],
  subject: string,
  body: string,
): Promise<void> {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (profilesError || !profiles) {
    console.error("[notifications] Failed to fetch profiles:", profilesError?.message);
    return;
  }

  const rows = profiles as ProfileRow[];
  const results = await Promise.allSettled(
    rows.map((profile) => sendEmail({ to: profile.email, subject, text: body })),
  );
  let failures = 0;
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      failures += 1;
      const reason = result.reason;
      console.error(
        `[notifications] Email failed for user ${rows[i].id}:`,
        reason instanceof Error ? reason.message : reason,
      );
    }
  });
  if (failures > 0) {
    console.error(
      `[notifications] Email fan-out: ${rows.length - failures}/${rows.length} delivered, ${failures} failed`,
    );
  }
}

export async function sendAttendanceNotification(
  childId: string,
  type: "enter" | "exit",
  recordedAt: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("name")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    if (childError) {
      console.error("[notifications] Failed to fetch child:", childError.message);
    }
    return;
  }

  const { data: links, error: linksError } = await supabase
    .from("child_parents")
    .select("parent_id")
    .eq("child_id", childId);

  if (linksError || !links || (links as { parent_id: string }[]).length === 0) {
    return;
  }

  const parentIds = (links as { parent_id: string }[]).map((l) => l.parent_id);

  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("user_id, method")
    .in("user_id", parentIds);

  if (prefsError || !prefs) {
    return;
  }

  const { pushIds, emailIds } = partitionByMethod(prefs as NotificationPreferenceRow[]);
  if (pushIds.length === 0 && emailIds.length === 0) return;

  const childName = (child as { name: string }).name;
  const messages = formatAttendanceMessages(childName, type, recordedAt);

  if (pushIds.length > 0) {
    const payload = JSON.stringify({
      title: messages.pushMessage,
      body: messages.pushMessage,
      url: "/attendance",
    });
    await sendPushNotifications(supabase, pushIds, payload);
  }

  if (emailIds.length > 0) {
    await sendEmailNotifications(supabase, emailIds, messages.emailSubject, messages.emailBody);
  }
}
