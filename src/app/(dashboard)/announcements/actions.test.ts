import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockRedirect = vi.fn<(url: string) => never>();
vi.mock("next/navigation", () => ({
  redirect: (...args: Parameters<typeof mockRedirect>) => {
    mockRedirect(...args);
    throw new Error(`NEXT_REDIRECT:${args[0]}`);
  },
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

const mockUploadAttachment = vi.fn();
vi.mock("@/lib/attachments/actions", () => ({
  uploadAttachment: (...args: unknown[]) => mockUploadAttachment(...args),
}));

const mockSendNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/notifications/send", () => ({
  sendAnnouncementNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

import { createAnnouncement, getReadCount, markAsRead } from "./actions";

describe("createAnnouncement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });

    const result = await createAnnouncement(null, new FormData());
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("権限");
  });

  it("allows admin users with audience=all", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current!.enqueue("announcements", { data: { id: "ann-1" }, error: null });

    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");
    fd.set("audience", "all");

    await expect(createAnnouncement(null, fd)).rejects.toThrow("NEXT_REDIRECT");

    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({
        table: "announcement_recipients",
        op: "insert",
        payload: [
          expect.objectContaining({
            announcement_id: "ann-1",
            recipient_type: "all",
            recipient_user_id: null,
          }),
        ],
      }),
    );
  });

  it("allows teacher users with individual recipients", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    holder.current!.enqueue("announcements", { data: { id: "ann-1" }, error: null });

    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");
    fd.set("audience", "user");
    fd.append("userIds", "p1");
    fd.append("userIds", "p2");

    await expect(createAnnouncement(null, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({
        table: "announcement_recipients",
        op: "insert",
        payload: [
          expect.objectContaining({ recipient_type: "user", recipient_user_id: "p1" }),
          expect.objectContaining({ recipient_type: "user", recipient_user_id: "p2" }),
        ],
      }),
    );
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
    holder.current!.enqueue("announcements", { data: { id: "ann-1" }, error: null });
    mockUploadAttachment.mockResolvedValue({ success: true });

    const fd = new FormData();
    fd.set("title", "お知らせ");
    fd.set("body", "本文です");
    fd.set("audience", "all");
    fd.append("files", new File(["pdf"], "doc.pdf", { type: "application/pdf" }));

    await expect(createAnnouncement(null, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(holder.current!.spies.fromCalls).toContain("announcements");
    expect(holder.current!.spies.fromCalls).toContain("announcement_recipients");
    expect(mockUploadAttachment).toHaveBeenCalledWith(
      "announcement",
      "ann-1",
      expect.any(FormData),
    );
    expect(mockSendNotification).toHaveBeenCalledWith("ann-1", "お知らせ", "本文です");
  });

  it("returns error on DB failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current!.enqueue("announcements", {
      data: null,
      error: { message: "DB error" },
    });

    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");
    fd.set("audience", "all");

    const result = await createAnnouncement(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).not.toContain("DB error");
  });

  it("rolls back announcement when recipients insert fails", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current!.enqueue("announcements", { data: { id: "ann-1" }, error: null });
    holder.current!.enqueue("announcement_recipients", {
      data: null,
      error: { message: "recipients fail" },
    });

    const fd = new FormData();
    fd.set("title", "テスト");
    fd.set("body", "本文");
    fd.set("audience", "all");

    const result = await createAnnouncement(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).not.toContain("recipients fail");
    // Rollback path: delete on announcements
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "announcements", op: "delete" }),
    );
    expect(mockSendNotification).not.toHaveBeenCalled();
  });
});

describe("markAsRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("only marks for parent users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });

    await markAsRead("ann-1");
    expect(holder.current!.spies.fromCalls).toContain("announcement_reads");
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "announcement_reads", op: "upsert" }),
    );
  });

  it("does nothing for non-parent users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    await markAsRead("ann-1");
    expect(holder.current!.spies.fromCalls).toEqual([]);
  });
});

describe("getReadCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns count from DB", async () => {
    holder.current = createSupabaseMock({
      tables: { announcement_reads: { data: null, error: null, count: 5 } },
    });

    const count = await getReadCount("ann-1");
    expect(count).toBe(5);
    expect(holder.current!.spies.fromCalls).toContain("announcement_reads");
  });

  it("returns 0 when count is null", async () => {
    holder.current = createSupabaseMock({
      tables: { announcement_reads: { data: null, error: null, count: null } },
    });

    const count = await getReadCount("ann-1");
    expect(count).toBe(0);
  });
});
