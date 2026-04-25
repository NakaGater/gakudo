/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TEXT_LIMITS } from "@/config/constants";
import {
  partitionByMethod,
  truncateForPush,
  buildAnnouncementPayload,
  formatJSTTime,
  formatAttendanceMessages,
  getVapidKeys,
  type NotificationPreferenceRow,
} from "./send.helpers";

describe("partitionByMethod", () => {
  it("returns empty lists for empty input", () => {
    expect(partitionByMethod([])).toEqual({ pushIds: [], emailIds: [] });
  });

  it("routes 'push' to pushIds only", () => {
    const prefs: NotificationPreferenceRow[] = [{ user_id: "u1", method: "push" }];
    expect(partitionByMethod(prefs)).toEqual({ pushIds: ["u1"], emailIds: [] });
  });

  it("routes 'email' to emailIds only", () => {
    const prefs: NotificationPreferenceRow[] = [{ user_id: "u2", method: "email" }];
    expect(partitionByMethod(prefs)).toEqual({ pushIds: [], emailIds: ["u2"] });
  });

  it("routes 'both' to both lists", () => {
    const prefs: NotificationPreferenceRow[] = [{ user_id: "u3", method: "both" }];
    expect(partitionByMethod(prefs)).toEqual({ pushIds: ["u3"], emailIds: ["u3"] });
  });

  it("excludes 'off' from both lists", () => {
    const prefs: NotificationPreferenceRow[] = [{ user_id: "u4", method: "off" }];
    expect(partitionByMethod(prefs)).toEqual({ pushIds: [], emailIds: [] });
  });

  it("preserves order and partitions a mixed list correctly", () => {
    const prefs: NotificationPreferenceRow[] = [
      { user_id: "p", method: "push" },
      { user_id: "e", method: "email" },
      { user_id: "b", method: "both" },
      { user_id: "o", method: "off" },
    ];
    expect(partitionByMethod(prefs)).toEqual({
      pushIds: ["p", "b"],
      emailIds: ["e", "b"],
    });
  });
});

describe("truncateForPush", () => {
  it("returns short bodies unchanged", () => {
    expect(truncateForPush("hello")).toBe("hello");
  });

  it("returns body unchanged at exactly the limit (no ellipsis)", () => {
    const exact = "あ".repeat(TEXT_LIMITS.NOTIFICATION_BODY_LENGTH);
    expect(truncateForPush(exact)).toBe(exact);
    expect(truncateForPush(exact)).not.toContain("…");
  });

  it("truncates to limit + '…' when body exceeds the limit", () => {
    const tooLong = "あ".repeat(TEXT_LIMITS.NOTIFICATION_BODY_LENGTH + 1);
    const result = truncateForPush(tooLong);
    expect(result.endsWith("…")).toBe(true);
    expect([...result].length).toBe(TEXT_LIMITS.NOTIFICATION_BODY_LENGTH + 1); // 100 chars + "…"
  });
});

describe("buildAnnouncementPayload", () => {
  it("produces a JSON string with title/body/url", () => {
    const json = buildAnnouncementPayload("お知らせ", "本文", "/announcements/1");
    expect(JSON.parse(json)).toEqual({
      title: "お知らせ",
      body: "本文",
      url: "/announcements/1",
    });
  });

  it("applies truncation to long bodies", () => {
    const longBody = "あ".repeat(200);
    const parsed = JSON.parse(buildAnnouncementPayload("t", longBody, "/u"));
    expect(parsed.body.endsWith("…")).toBe(true);
    expect([...parsed.body].length).toBe(TEXT_LIMITS.NOTIFICATION_BODY_LENGTH + 1);
  });
});

describe("formatJSTTime", () => {
  it("converts UTC 09:00 to JST 18:00", () => {
    expect(formatJSTTime("2024-01-15T09:00:00.000Z")).toBe("18:00");
  });

  it("converts UTC 06:30 to JST 15:30", () => {
    expect(formatJSTTime("2024-01-15T06:30:00.000Z")).toBe("15:30");
  });

  it("converts UTC 23:00 to JST 08:00 (next day)", () => {
    expect(formatJSTTime("2024-01-15T23:00:00.000Z")).toBe("08:00");
  });
});

describe("formatAttendanceMessages", () => {
  it("formats enter notification", () => {
    expect(formatAttendanceMessages("太郎", "enter", "2024-01-15T06:30:00.000Z")).toEqual({
      pushMessage: "太郎が入室しました (15:30)",
      emailSubject: "【星ヶ丘こどもクラブ】太郎の入室通知",
      emailBody: "太郎が15:30に入室しました。",
    });
  });

  it("formats exit notification", () => {
    expect(formatAttendanceMessages("花子", "exit", "2024-01-15T09:00:00.000Z")).toEqual({
      pushMessage: "花子が退室しました (18:00)",
      emailSubject: "【星ヶ丘こどもクラブ】花子の退室通知",
      emailBody: "花子が18:00に退室しました。",
    });
  });
});

describe("getVapidKeys", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("returns keys when both env vars are set", () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub";
    process.env.VAPID_PRIVATE_KEY = "priv";
    expect(getVapidKeys()).toEqual({ publicKey: "pub", privateKey: "priv" });
  });

  it("throws when public key is missing", () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    process.env.VAPID_PRIVATE_KEY = "priv";
    expect(() => getVapidKeys()).toThrow("VAPID keys are not configured");
  });

  it("throws when private key is missing", () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub";
    delete process.env.VAPID_PRIVATE_KEY;
    expect(() => getVapidKeys()).toThrow("VAPID keys are not configured");
  });
});
