import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock next/navigation
const mockRedirect = vi.fn<(url: string) => never>();
vi.mock("next/navigation", () => ({
  redirect: (...args: Parameters<typeof mockRedirect>) => {
    mockRedirect(...args);
    throw new Error(`NEXT_REDIRECT:${args[0]}`);
  },
}));

// Mock getUser
const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

// Mock uploadAttachment
const mockUploadAttachment = vi.fn();
vi.mock("@/lib/attachments/actions", () => ({
  uploadAttachment: (...args: unknown[]) => mockUploadAttachment(...args),
}));

// Mock notification
const mockSendNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/notifications/send", () => ({
  sendAnnouncementNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

// Mock Supabase - chainable query builder
const mockSingle = vi.fn();
const mockSelectChain = vi.fn(() => ({ single: mockSingle }));
const mockAnnouncementsInsert = vi.fn(() => ({ select: mockSelectChain }));
const mockRecipientsInsert = vi.fn().mockResolvedValue({ error: null });
const mockAnnouncementsDelete = vi.fn(() => ({
  eq: vi.fn().mockResolvedValue({ error: null }),
}));
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockEqCount = vi.fn().mockResolvedValue({ count: 0 });
const mockSelectCount = vi.fn(() => ({ eq: mockEqCount }));
const mockFrom = vi.fn((table: string) => {
  if (table === "announcement_reads") {
    return { upsert: mockUpsert, select: mockSelectCount };
  }
  if (table === "announcement_recipients") {
    return { insert: mockRecipientsInsert };
  }
  // announcements
  return { insert: mockAnnouncementsInsert, delete: mockAnnouncementsDelete };
});
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: unknown[]) => mockFrom(...(args as [string])),
    }),
  ),
}));

import { createAnnouncement, markAsRead, getReadCount } from "./actions";

describe("createAnnouncement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecipientsInsert.mockResolvedValue({ error: null });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });

    const result = await createAnnouncement(null, new FormData());
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("権限");
  });

  it("allows admin users with audience=all", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockSingle.mockResolvedValue({ data: { id: "ann-1" }, error: null });

    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");
    fd.set("audience", "all");

    await expect(createAnnouncement(null, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRecipientsInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        announcement_id: "ann-1",
        recipient_type: "all",
        recipient_user_id: null,
      }),
    ]);
  });

  it("allows teacher users with individual recipients", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    mockSingle.mockResolvedValue({ data: { id: "ann-1" }, error: null });

    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");
    fd.set("audience", "user");
    fd.append("userIds", "p1");
    fd.append("userIds", "p2");

    await expect(createAnnouncement(null, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRecipientsInsert).toHaveBeenCalledWith([
      expect.objectContaining({ recipient_type: "user", recipient_user_id: "p1" }),
      expect.objectContaining({ recipient_type: "user", recipient_user_id: "p2" }),
    ]);
  });

  it("rejects audience=user with no userIds", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");
    fd.set("audience", "user");

    const result = await createAnnouncement(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.fieldErrors?.recipients).toContain("ユーザー");
  });

  it("rejects missing audience", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");

    const result = await createAnnouncement(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.fieldErrors?.recipients).toBeTruthy();
  });

  it("validates title is required", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "");
    fd.set("body", "本文あり");
    fd.set("audience", "all");

    const result = await createAnnouncement(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.fieldErrors?.title).toContain("タイトル");
  });

  it("validates title max length (200 chars)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "a".repeat(201));
    fd.set("body", "本文あり");
    fd.set("audience", "all");

    const result = await createAnnouncement(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.fieldErrors?.title).toContain("200文字");
  });

  it("validates body is required", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "タイトル");
    fd.set("body", "");
    fd.set("audience", "all");

    const result = await createAnnouncement(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.fieldErrors?.body).toContain("本文");
  });

  it("creates announcement with file uploads", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockSingle.mockResolvedValue({ data: { id: "ann-1" }, error: null });
    mockUploadAttachment.mockResolvedValue({ success: true });

    const fd = new FormData();
    fd.set("title", "お知らせ");
    fd.set("body", "本文です");
    fd.set("audience", "all");
    fd.append("files", new File(["pdf"], "doc.pdf", { type: "application/pdf" }));

    await expect(createAnnouncement(null, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockFrom).toHaveBeenCalledWith("announcements");
    expect(mockFrom).toHaveBeenCalledWith("announcement_recipients");
    expect(mockUploadAttachment).toHaveBeenCalledWith(
      "announcement",
      "ann-1",
      expect.any(FormData),
    );
    expect(mockSendNotification).toHaveBeenCalledWith("ann-1", "お知らせ", "本文です");
  });

  it("returns error on DB failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");
    fd.set("audience", "all");

    const result = await createAnnouncement(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).not.toContain("DB error");
    expect(result?.success).toBe(false);
  });

  it("rolls back announcement when recipients insert fails", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockSingle.mockResolvedValue({ data: { id: "ann-1" }, error: null });
    mockRecipientsInsert.mockResolvedValueOnce({ error: { message: "recipients fail" } });

    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");
    fd.set("audience", "all");

    const result = await createAnnouncement(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).not.toContain("recipients fail");
    expect(result?.success).toBe(false);
    expect(mockAnnouncementsDelete).toHaveBeenCalled();
    expect(mockSendNotification).not.toHaveBeenCalled();
  });
});

describe("markAsRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("only marks for parent users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });

    await markAsRead("ann-1");
    expect(mockFrom).toHaveBeenCalledWith("announcement_reads");
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("does nothing for non-parent users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    await markAsRead("ann-1");
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("getReadCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns count from DB", async () => {
    mockEqCount.mockResolvedValue({ count: 5 });

    const count = await getReadCount("ann-1");
    expect(count).toBe(5);
    expect(mockFrom).toHaveBeenCalledWith("announcement_reads");
  });

  it("returns 0 when count is null", async () => {
    mockEqCount.mockResolvedValue({ count: null });

    const count = await getReadCount("ann-1");
    expect(count).toBe(0);
  });
});
