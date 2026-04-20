import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

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
vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockEmailSend };
  },
}));

import { sendAnnouncementNotification } from "./send";

// Helper to build chained Supabase query mocks
function mockSupabaseQuery(resolvedValue: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(resolvedValue);
  // .in() is the terminal call in our queries
  const selectFn = vi.fn().mockReturnValue({ in: terminal });
  return { select: selectFn, in: terminal };
}

describe("sendAnnouncementNotification", () => {
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

  it("sends push notification to subscribed users", async () => {
    const prefsQuery = mockSupabaseQuery({
      data: [{ user_id: "user-1", method: "push" }],
      error: null,
    });
    const subsQuery = mockSupabaseQuery({
      data: [
        {
          user_id: "user-1",
          subscription: {
            endpoint: "https://push.example.com/1",
            keys: { p256dh: "key1", auth: "auth1" },
          },
        },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_preferences") return prefsQuery;
      if (table === "push_subscriptions") return subsQuery;
      return mockSupabaseQuery({ data: [], error: null });
    });

    mockSendNotification.mockResolvedValue({});

    await sendAnnouncementNotification("ann-1", "テストお知らせ", "テスト本文です");

    expect(mockSetVapidDetails).toHaveBeenCalled();
    expect(mockSendNotification).toHaveBeenCalledWith(
      { endpoint: "https://push.example.com/1", keys: { p256dh: "key1", auth: "auth1" } },
      expect.stringContaining("テストお知らせ"),
    );
  });

  it("sends email to email-preference users", async () => {
    const prefsQuery = mockSupabaseQuery({
      data: [{ user_id: "user-2", method: "email" }],
      error: null,
    });
    const profilesQuery = mockSupabaseQuery({
      data: [{ id: "user-2", email: "parent@example.com" }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_preferences") return prefsQuery;
      if (table === "profiles") return profilesQuery;
      return mockSupabaseQuery({ data: [], error: null });
    });

    mockEmailSend.mockResolvedValue({ id: "email-1" });

    await sendAnnouncementNotification("ann-2", "メールテスト", "メール本文です");

    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "parent@example.com",
        subject: "【星ヶ丘こどもクラブ】メールテスト",
        text: "メール本文です",
      }),
    );
  });

  it("sends both push and email for 'both' preference", async () => {
    const prefsQuery = mockSupabaseQuery({
      data: [{ user_id: "user-3", method: "both" }],
      error: null,
    });
    const subsQuery = mockSupabaseQuery({
      data: [
        {
          user_id: "user-3",
          subscription: {
            endpoint: "https://push.example.com/3",
            keys: { p256dh: "key3", auth: "auth3" },
          },
        },
      ],
      error: null,
    });
    const profilesQuery = mockSupabaseQuery({
      data: [{ id: "user-3", email: "both@example.com" }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_preferences") return prefsQuery;
      if (table === "push_subscriptions") return subsQuery;
      if (table === "profiles") return profilesQuery;
      return mockSupabaseQuery({ data: [], error: null });
    });

    mockSendNotification.mockResolvedValue({});
    mockEmailSend.mockResolvedValue({ id: "email-3" });

    await sendAnnouncementNotification("ann-3", "両方テスト", "両方の本文");

    expect(mockSendNotification).toHaveBeenCalled();
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "both@example.com" }),
    );
  });

  it("handles push errors gracefully (no throw)", async () => {
    const prefsQuery = mockSupabaseQuery({
      data: [{ user_id: "user-4", method: "push" }],
      error: null,
    });
    const subsQuery = mockSupabaseQuery({
      data: [
        {
          user_id: "user-4",
          subscription: {
            endpoint: "https://push.example.com/4",
            keys: { p256dh: "key4", auth: "auth4" },
          },
        },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_preferences") return prefsQuery;
      if (table === "push_subscriptions") return subsQuery;
      return mockSupabaseQuery({ data: [], error: null });
    });

    mockSendNotification.mockRejectedValue(new Error("Push service unavailable"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Should not throw
    await expect(
      sendAnnouncementNotification("ann-4", "エラーテスト", "エラー本文"),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Push failed"),
      "Push service unavailable",
    );
    consoleSpy.mockRestore();
  });

  it("handles email errors gracefully (no throw)", async () => {
    const prefsQuery = mockSupabaseQuery({
      data: [{ user_id: "user-5", method: "email" }],
      error: null,
    });
    const profilesQuery = mockSupabaseQuery({
      data: [{ id: "user-5", email: "fail@example.com" }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_preferences") return prefsQuery;
      if (table === "profiles") return profilesQuery;
      return mockSupabaseQuery({ data: [], error: null });
    });

    mockEmailSend.mockRejectedValue(new Error("Resend API error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendAnnouncementNotification("ann-5", "メールエラー", "エラー本文"),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Email failed"),
      "Resend API error",
    );
    consoleSpy.mockRestore();
  });

  it("does nothing when no preferences found", async () => {
    const prefsQuery = mockSupabaseQuery({
      data: [],
      error: null,
    });

    mockFrom.mockImplementation(() => prefsQuery);

    await sendAnnouncementNotification("ann-6", "空テスト", "空本文");

    expect(mockSendNotification).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });
});
