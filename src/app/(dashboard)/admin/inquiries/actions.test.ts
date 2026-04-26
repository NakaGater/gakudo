import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const { mockUser, mockGetUser } = vi.hoisted(() => {
  const mockUser = { id: "admin-1", email: "admin@test.com", name: "管理者", role: "admin" };
  const mockGetUser = vi.fn().mockResolvedValue(mockUser);
  return { mockUser, mockGetUser };
});

vi.mock("@/lib/auth/get-user", () => ({
  getUser: mockGetUser,
}));

// Mock Supabase
const { mockSingle, mockUpdate, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn().mockResolvedValue({ data: { email: "user@test.com", name: "太郎" } });
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === "inquiries") {
      return {
        select: (...args: unknown[]) => {
          if (
            typeof args[1] === "object" &&
            args[1] !== null &&
            "count" in (args[1] as Record<string, unknown>)
          ) {
            // Phase 3-D: getInquiries now runs count + data queries in
            // parallel. The countQuery is awaited directly OR after .eq(),
            // so both shapes need to be thenable to `{ count }`.
            const countResolved = (resolve: (v: unknown) => void) =>
              resolve({ count: 3, error: null });
            return {
              then: countResolved,
              eq: vi.fn().mockReturnValue({ then: countResolved }),
            };
          }
          if (typeof args[0] === "string") {
            // Phase 3-E: getInquiries / getInquiry now request explicit
            // columns; previously this branch was gated on "*".
            // Phase 3-D: order().range() is the new pagination shape.
            const dataResolve = (resolve: (v: unknown) => void) =>
              resolve({ data: [], error: null });
            const orderResult = {
              then: dataResolve,
              range: vi.fn().mockReturnValue({
                then: dataResolve,
                eq: vi.fn().mockReturnValue({ then: dataResolve }),
              }),
              eq: vi.fn().mockReturnValue({
                then: dataResolve,
                range: vi.fn().mockReturnValue({ then: dataResolve }),
              }),
            };
            return {
              order: vi.fn().mockReturnValue(orderResult),
              eq: vi.fn().mockReturnValue({
                single: mockSingle,
                order: vi.fn().mockReturnValue(orderResult),
                range: vi.fn().mockReturnValue({ then: dataResolve }),
              }),
              range: vi.fn().mockReturnValue({ then: dataResolve }),
            };
          }
          return mockSelect();
        },
        update: mockUpdate,
      };
    }
    return { select: mockSelect };
  });
  return { mockSingle, mockUpdate, mockFrom };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "test" }),
}));

import {
  getReplyTemplate,
  replyToInquiry,
  getInquiries,
  getInquiry,
  getPendingInquiryCount,
} from "./actions";

describe("getInquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(mockUser);
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
  });

  it("returns null for non-staff users", async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, role: "parent" });
    const result = await getInquiry("test-id");
    expect(result).toBeNull();
  });

  it("returns inquiry data for staff", async () => {
    mockSingle.mockResolvedValue({ data: { id: "test-id", name: "太郎", status: "pending" } });
    const result = await getInquiry("test-id");
    expect(result).toBeTruthy();
  });

  it("returns null when not found", async () => {
    mockSingle.mockResolvedValue({ data: null });
    const result = await getInquiry("missing");
    expect(result).toBeNull();
  });
});

describe("getPendingInquiryCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(mockUser);
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
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockSingle.mockResolvedValue({ data: { email: "user@test.com", name: "太郎" } });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, role: "parent" });
    const result = await replyToInquiry("test-id", "approved", "承認します");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("returns error when inquiry not found", async () => {
    mockSingle.mockResolvedValue({ data: null });
    const result = await replyToInquiry("missing-id", "approved", "承認します");
    expect(result.success).toBe(false);
    expect(result.message).toContain("見つかりません");
  });

  it("returns error when update fails", async () => {
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
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
