import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

const { mockUser, mockGetUser } = vi.hoisted(() => {
  const mockUser = { id: "admin-1", email: "admin@test.com", name: "管理者", role: "admin" };
  const mockGetUser = vi.fn().mockResolvedValue(mockUser);
  return { mockUser, mockGetUser };
});

vi.mock("@/lib/auth/get-user", () => ({
  getUser: mockGetUser,
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "test" }),
}));

import {
  getInquiries,
  getInquiry,
  getPendingInquiryCount,
  getReplyTemplate,
  replyToInquiry,
} from "./actions";

describe("getInquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(mockUser);
    holder.current = createSupabaseMock({
      tables: { inquiries: { data: [], error: null, count: 3 } },
    });
  });

  it("returns an empty page for non-staff users", async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, role: "parent" });
    const result = await getInquiries();
    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("returns paginated inquiries for staff", async () => {
    const result = await getInquiries();
    expect(Array.isArray(result.rows)).toBe(true);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("passes status filter when provided", async () => {
    const result = await getInquiries("pending");
    expect(Array.isArray(result.rows)).toBe(true);
  });

  it("does not filter when status is 'all'", async () => {
    const result = await getInquiries("all");
    expect(Array.isArray(result.rows)).toBe(true);
  });
});

describe("getInquiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(mockUser);
    holder.current = createSupabaseMock();
  });

  it("returns null for non-staff users", async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, role: "parent" });
    const result = await getInquiry("test-id");
    expect(result).toBeNull();
  });

  it("returns inquiry data for staff", async () => {
    holder.current = createSupabaseMock({
      tables: {
        inquiries: { data: { id: "test-id", name: "太郎", status: "pending" }, error: null },
      },
    });
    const result = await getInquiry("test-id");
    expect(result).toBeTruthy();
  });

  it("returns null when not found", async () => {
    holder.current = createSupabaseMock({
      tables: { inquiries: { data: null, error: null } },
    });
    const result = await getInquiry("missing");
    expect(result).toBeNull();
  });
});

describe("getPendingInquiryCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(mockUser);
    holder.current = createSupabaseMock({
      tables: { inquiries: { data: null, error: null, count: 3 } },
    });
  });

  it("returns 0 for non-staff users", async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, role: "parent" });
    const result = await getPendingInquiryCount();
    expect(result).toBe(0);
  });

  it("returns count for staff", async () => {
    const result = await getPendingInquiryCount();
    expect(result).toBe(3);
  });
});

describe("getReplyTemplate", () => {
  it("generates approved template with preferred date", async () => {
    const result = await getReplyTemplate("approved", "太郎", "12月15日");
    expect(result).toContain("太郎 様");
    expect(result).toContain("12月15日にお待ちしております");
    expect(result).toContain("星ヶ丘こどもクラブ");
  });

  it("generates approved template without preferred date", async () => {
    const result = await getReplyTemplate("approved", "太郎", null);
    expect(result).toContain("太郎 様");
    expect(result).toContain("日程の詳細は追ってご連絡");
  });

  it("generates declined template", async () => {
    const result = await getReplyTemplate("declined", "太郎", null);
    expect(result).toContain("太郎 様");
    expect(result).toContain("対応が難しい");
  });
});

describe("replyToInquiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(mockUser);
    holder.current = createSupabaseMock({
      tables: {
        inquiries: { data: { email: "user@test.com", name: "太郎" }, error: null },
      },
    });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, role: "parent" });
    const result = await replyToInquiry("test-id", "approved", "承認します");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("returns error when inquiry not found", async () => {
    holder.current = createSupabaseMock({
      tables: { inquiries: { data: null, error: null } },
    });
    const result = await replyToInquiry("missing-id", "approved", "承認します");
    expect(result.success).toBe(false);
    expect(result.message).toContain("見つかりません");
  });

  it("returns error when update fails", async () => {
    holder.current = createSupabaseMock({
      tableResolver: (table, op) => {
        if (table !== "inquiries") return undefined;
        if (op === "update") return { data: null, error: { message: "DB error" } };
        return { data: { email: "user@test.com", name: "太郎" }, error: null };
      },
    });
    const result = await replyToInquiry("test-id", "approved", "承認します");
    expect(result.success).toBe(false);
    expect(result.message).toContain("更新に失敗");
  });

  it("succeeds for approved action", async () => {
    const result = await replyToInquiry("test-id", "approved", "承認します");
    expect(result.success).toBe(true);
    expect(result.message).toContain("承認");
  });

  it("succeeds for declined action", async () => {
    const result = await replyToInquiry("test-id", "declined", "お断りします");
    expect(result.success).toBe(true);
    expect(result.message).toContain("お断り");
  });

  it("succeeds for free reply action", async () => {
    const result = await replyToInquiry("test-id", "replied", "カスタム返信");
    expect(result.success).toBe(true);
    expect(result.message).toContain("返信");
  });
});
