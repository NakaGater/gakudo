import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    // Reset module cache so env changes take effect
    vi.resetModules();
  });

  it("sends via Mailpit when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ID: "mailpit-123" }),
    });

    const { sendEmail } = await import("./send");
    const result = await sendEmail({
      to: "user@example.com",
      subject: "テスト",
      text: "テスト本文",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0]!;
    expect(url).toContain("/send");
    expect(opts.method).toBe("POST");

    const body = JSON.parse(opts.body);
    expect(body.To[0].Email).toBe("user@example.com");
    expect(body.Subject).toBe("テスト");
    expect(body.Text).toBe("テスト本文");
    expect(result.id).toBe("mailpit-123");
  });

  it("parses 'Name <email>' from address correctly", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ID: "mp-1" }),
    });

    const { sendEmail } = await import("./send");
    await sendEmail({
      to: "user@example.com",
      subject: "テスト",
      text: "本文",
      from: "こどもクラブ <info@school.com>",
    });

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.From.Name).toBe("こどもクラブ");
    expect(body.From.Email).toBe("info@school.com");
  });

  it("handles plain email from address", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ID: "mp-2" }),
    });

    const { sendEmail } = await import("./send");
    await sendEmail({
      to: "user@example.com",
      subject: "テスト",
      text: "本文",
      from: "plain@email.com",
    });

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.From.Name).toBe("");
    expect(body.From.Email).toBe("plain@email.com");
  });

  it("throws error when Mailpit returns non-ok status", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const { sendEmail } = await import("./send");
    await expect(
      sendEmail({ to: "user@example.com", subject: "テスト", text: "本文" }),
    ).rejects.toThrow("Mailpit send failed: 500");
  });

  it("returns fallback id when Mailpit returns no ID", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { sendEmail } = await import("./send");
    const result = await sendEmail({
      to: "user@example.com",
      subject: "テスト",
      text: "本文",
    });
    expect(result.id).toBe("mailpit");
  });

  it("sends via Resend when RESEND_API_KEY is set", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");

    const mockSend = vi.fn().mockResolvedValue({ data: { id: "resend-456" } });
    vi.doMock("resend", () => ({
      Resend: class {
        emails = { send: mockSend };
      },
    }));

    const { sendEmail } = await import("./send");
    const result = await sendEmail({
      to: "user@example.com",
      subject: "テスト",
      text: "テスト本文",
    });

    expect(mockSend).toHaveBeenCalledWith({
      from: expect.any(String),
      to: "user@example.com",
      subject: "テスト",
      text: "テスト本文",
    });
    expect(result.id).toBe("resend-456");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 'unknown' when Resend returns no id", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");

    const mockSend = vi.fn().mockResolvedValue({ data: null });
    vi.doMock("resend", () => ({
      Resend: class {
        emails = { send: mockSend };
      },
    }));

    const { sendEmail } = await import("./send");
    const result = await sendEmail({
      to: "user@example.com",
      subject: "テスト",
      text: "テスト本文",
    });

    expect(result.id).toBe("unknown");
  });
});
