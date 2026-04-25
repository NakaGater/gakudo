import { describe, it, expect, vi, beforeEach } from "vitest";

// I/O 境界のみモック: Supabase admin client / web-push / sendEmail。
// JSON ペイロード組み立て・JST 整形・preference 振り分けは send.helpers.test.ts でカバー済み。
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: mockFrom })),
}));

const mockSendNotification = vi.fn();
const mockSetVapidDetails = vi.fn();
vi.mock("web-push", () => ({
  default: {
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
    setVapidDetails: (...args: unknown[]) => mockSetVapidDetails(...args),
  },
}));

const mockEmailSend = vi.fn();
vi.mock("@/lib/email/send", () => ({
  sendEmail: (...args: unknown[]) => mockEmailSend(...args),
}));

import { sendAnnouncementNotification, sendAttendanceNotification } from "./send";

/** Build a Supabase chain that resolves the terminal call to the given value. */
function chain(resolved: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: Record<string, any> = {};
  c.select = vi.fn().mockReturnValue(c);
  c.eq = vi.fn().mockReturnValue(c);
  c.in = vi.fn().mockReturnValue(c);
  c.single = vi.fn().mockReturnValue(c);
  // thenable so awaits resolve
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  c.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(resolved).then(onFulfilled, onRejected);
  return c;
}

const originalEnv = { ...process.env };
beforeEach(() => {
  vi.clearAllMocks();
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "test-public-key",
    VAPID_PRIVATE_KEY: "test-private-key",
    RESEND_API_KEY: "re_test_key",
  };
});

describe("sendAnnouncementNotification", () => {
  it("does nothing when no preferences are returned", async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }));

    await sendAnnouncementNotification("ann-1", "title", "body");

    expect(mockSendNotification).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("delivers a push notification to subscribed users", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_preferences") {
        return chain({ data: [{ user_id: "u1", method: "push" }], error: null });
      }
      if (table === "push_subscriptions") {
        return chain({
          data: [
            {
              user_id: "u1",
              subscription: {
                endpoint: "https://push.example.com/1",
                keys: { p256dh: "k", auth: "a" },
              },
            },
          ],
          error: null,
        });
      }
      return chain({ data: [], error: null });
    });
    mockSendNotification.mockResolvedValue({});

    await sendAnnouncementNotification("ann-2", "お知らせ", "本文");

    expect(mockSendNotification).toHaveBeenCalledTimes(1);
    // 境界契約: subscription 引数のキーが endpoint で一致すること
    const [subscriptionArg] = mockSendNotification.mock.calls[0];
    expect(subscriptionArg.endpoint).toBe("https://push.example.com/1");
  });

  it("delivers an email to email-preference users", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_preferences") {
        return chain({ data: [{ user_id: "u2", method: "email" }], error: null });
      }
      if (table === "profiles") {
        return chain({ data: [{ id: "u2", email: "parent@example.com" }], error: null });
      }
      return chain({ data: [], error: null });
    });
    mockEmailSend.mockResolvedValue({ id: "e1" });

    await sendAnnouncementNotification("ann-3", "お知らせ", "本文");

    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "parent@example.com" }),
    );
  });

  it("does not throw when push delivery fails (and proceeds to email)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_preferences") {
        return chain({ data: [{ user_id: "u4", method: "both" }], error: null });
      }
      if (table === "push_subscriptions") {
        return chain({
          data: [
            {
              user_id: "u4",
              subscription: {
                endpoint: "https://push.example.com/4",
                keys: { p256dh: "k", auth: "a" },
              },
            },
          ],
          error: null,
        });
      }
      if (table === "profiles") {
        return chain({ data: [{ id: "u4", email: "u4@example.com" }], error: null });
      }
      return chain({ data: [], error: null });
    });
    mockSendNotification.mockRejectedValue(new Error("Push down"));
    mockEmailSend.mockResolvedValue({ id: "e2" });

    // Silence the expected console.error
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendAnnouncementNotification("ann-4", "お知らせ", "本文"),
    ).resolves.toBeUndefined();

    // Email still delivered after push failure
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    errSpy.mockRestore();
  });
});

describe("sendAttendanceNotification", () => {
  it("does nothing when no parents are linked", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "children") return chain({ data: { name: "太郎" }, error: null });
      if (table === "child_parents") return chain({ data: [], error: null });
      return chain({ data: [], error: null });
    });

    await expect(
      sendAttendanceNotification("c1", "enter", "2024-01-15T06:30:00.000Z"),
    ).resolves.toBeUndefined();

    expect(mockSendNotification).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("delivers a push notification to a linked parent (enter)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "children") return chain({ data: { name: "太郎" }, error: null });
      if (table === "child_parents")
        return chain({ data: [{ parent_id: "parent-1" }], error: null });
      if (table === "notification_preferences")
        return chain({ data: [{ user_id: "parent-1", method: "push" }], error: null });
      if (table === "push_subscriptions") {
        return chain({
          data: [
            {
              user_id: "parent-1",
              subscription: {
                endpoint: "https://push.example.com/p1",
                keys: { p256dh: "k", auth: "a" },
              },
            },
          ],
          error: null,
        });
      }
      return chain({ data: [], error: null });
    });
    mockSendNotification.mockResolvedValue({});

    // 06:30 UTC = 15:30 JST
    await sendAttendanceNotification("c1", "enter", "2024-01-15T06:30:00.000Z");

    expect(mockSendNotification).toHaveBeenCalledTimes(1);
    const [subscription, payloadJson] = mockSendNotification.mock.calls[0];
    expect(subscription.endpoint).toBe("https://push.example.com/p1");
    // JSON 本体の組み立てロジックは helpers でカバー済みなので、ここでは含有のみ確認
    expect(payloadJson).toContain("太郎");
    expect(payloadJson).toContain("入室");
  });

  it("delivers an email when parent prefers email (exit)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "children") return chain({ data: { name: "花子" }, error: null });
      if (table === "child_parents")
        return chain({ data: [{ parent_id: "p2" }], error: null });
      if (table === "notification_preferences")
        return chain({ data: [{ user_id: "p2", method: "email" }], error: null });
      if (table === "profiles")
        return chain({
          data: [{ id: "p2", email: "p2@example.com" }],
          error: null,
        });
      return chain({ data: [], error: null });
    });
    mockEmailSend.mockResolvedValue({ id: "e1" });

    await sendAttendanceNotification("c2", "exit", "2024-01-15T09:00:00.000Z");

    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "p2@example.com" }),
    );
  });

  it("skips push and email when all preferences are 'off'", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "children") return chain({ data: { name: "次郎" }, error: null });
      if (table === "child_parents")
        return chain({ data: [{ parent_id: "p3" }], error: null });
      if (table === "notification_preferences")
        return chain({ data: [{ user_id: "p3", method: "off" }], error: null });
      return chain({ data: [], error: null });
    });

    await sendAttendanceNotification("c3", "enter", "2024-01-15T06:00:00.000Z");

    expect(mockSendNotification).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });
});
