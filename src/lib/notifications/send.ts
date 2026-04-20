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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prefs, error: prefsError } = await (supabase as any)
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
    await sendPushNotifications(supabase, pushUserIds, title, body, announcementId);
  }

  // Send email notifications
  if (emailUserIds.length > 0) {
    await sendEmailNotifications(supabase, emailUserIds, title, body);
  }
}

async function sendPushNotifications(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userIds: string[],
  title: string,
  body: string,
  announcementId: string,
): Promise<void> {
  let vapidKeys: { publicKey: string; privateKey: string };
  try {
    vapidKeys = getVapidKeys();
  } catch (e) {
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
    url: `/announcements/${announcementId}`,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userIds: string[],
  title: string,
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

  const subject = `【星ヶ丘こどもクラブ】${title}`;

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
