import webpush from "web-push";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_FROM =
  process.env.NOTIFICATION_EMAIL_FROM ??
  "星ヶ丘こどもクラブ <noreply@yourdomain.com>";

function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured");
  }
  return { publicKey, privateKey };
}

interface NotificationPreferenceRow {
  user_id: string;
  method: "push" | "email" | "both" | "off";
}

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

  // Fetch parents who have notifications enabled
  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("user_id, method")
    .in("method", ["push", "email", "both"]);

  if (prefsError || !prefs || (prefs as NotificationPreferenceRow[]).length === 0) {
    if (prefsError) {
      console.error("[notifications] Failed to fetch preferences:", prefsError.message);
    }
    return;
  }

  const preferences = prefs as NotificationPreferenceRow[];
  const pushUserIds = preferences
    .filter((p) => p.method === "push" || p.method === "both")
    .map((p) => p.user_id);
  const emailUserIds = preferences
    .filter((p) => p.method === "email" || p.method === "both")
    .map((p) => p.user_id);

  // Send push notifications
  if (pushUserIds.length > 0) {
    await sendPushNotifications(supabase, pushUserIds, title, body, `/announcements/${announcementId}`);
  }

  // Send email notifications
  if (emailUserIds.length > 0) {
    await sendEmailNotifications(supabase, emailUserIds, `【星ヶ丘こどもクラブ】${title}`, body);
  }
}

async function sendPushNotifications(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[],
  title: string,
  body: string,
  url: string,
): Promise<void> {
  let vapidKeys: { publicKey: string; privateKey: string };
  try {
    vapidKeys = getVapidKeys();
  } catch {
    console.error("[notifications] VAPID keys not configured, skipping push");
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

  const truncatedBody = body.length > 100 ? body.slice(0, 100) + "…" : body;
  const payload = JSON.stringify({
    title,
    body: truncatedBody,
    url,
  });

  for (const row of subs as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(row.subscription, payload);
    } catch (err) {
      console.error(
        `[notifications] Push failed for user ${row.user_id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

async function sendEmailNotifications(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[],
  subject: string,
  body: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[notifications] RESEND_API_KEY not configured, skipping email");
    return;
  }

  const resend = new Resend(apiKey);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (profilesError || !profiles) {
    console.error("[notifications] Failed to fetch profiles:", profilesError?.message);
    return;
  }

  for (const profile of profiles as ProfileRow[]) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: profile.email,
        subject,
        text: body,
      });
    } catch (err) {
      console.error(
        `[notifications] Email failed for user ${profile.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

/** Format ISO timestamp as HH:mm in JST */
function formatJSTTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export async function sendAttendanceNotification(
  childId: string,
  type: "enter" | "exit",
  recordedAt: string,
): Promise<void> {
  const supabase = createAdminClient();

  // 1. Fetch child name
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

  // 2. Fetch linked parent IDs
  const { data: links, error: linksError } = await supabase
    .from("child_parents")
    .select("parent_id")
    .eq("child_id", childId);

  if (linksError || !links || (links as { parent_id: string }[]).length === 0) {
    return;
  }

  const parentIds = (links as { parent_id: string }[]).map((l) => l.parent_id);

  // 3. Fetch notification preferences for parents
  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("user_id, method")
    .in("user_id", parentIds);

  if (prefsError || !prefs) {
    return;
  }

  const activePrefs = (prefs as NotificationPreferenceRow[]).filter(
    (p) => p.method === "push" || p.method === "email" || p.method === "both",
  );

  if (activePrefs.length === 0) return;

  // 4. Build messages
  const jstTime = formatJSTTime(recordedAt);
  const actionLabel = type === "enter" ? "入室" : "退室";
  const childName = (child as { name: string }).name;

  const pushMessage = `${childName}が${actionLabel}しました (${jstTime})`;
  const emailSubject = `【星ヶ丘こどもクラブ】${childName}の${actionLabel}通知`;
  const emailBody = `${childName}が${jstTime}に${actionLabel}しました。`;

  // 5. Send push notifications
  const pushUserIds = activePrefs
    .filter((p) => p.method === "push" || p.method === "both")
    .map((p) => p.user_id);

  if (pushUserIds.length > 0) {
    await sendPushNotifications(supabase, pushUserIds, pushMessage, pushMessage, "/attendance");
  }

  // 6. Send email notifications
  const emailUserIds = activePrefs
    .filter((p) => p.method === "email" || p.method === "both")
    .map((p) => p.user_id);

  if (emailUserIds.length > 0) {
    await sendEmailNotifications(supabase, emailUserIds, emailSubject, emailBody);
  }
}
