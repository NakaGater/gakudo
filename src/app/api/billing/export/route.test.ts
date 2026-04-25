import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockProfileSelect = vi.fn();
const mockBillsSelect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({ eq: () => ({ single: () => mockProfileSelect() }) }),
          };
        }
        if (table === "monthly_bills") {
          return {
            select: () => ({ eq: () => mockBillsSelect() }),
          };
        }
        return { select: () => Promise.resolve({ data: null, error: null }) };
      },
    }),
  ),
}));

const mockGenerateBillingCSV = vi.fn();
vi.mock("@/lib/billing/csv", () => ({
  generateBillingCSV: (...args: unknown[]) => mockGenerateBillingCSV(...args),
}));

import { GET } from "./route";

function makeRequest(queryParams?: Record<string, string>, method = "GET") {
  const url = new URL("http://localhost/api/billing/export");
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return new Request(url.toString(), { method });
}

describe("GET /api/billing/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const res = await GET(makeRequest({ yearMonth: "2025-01" }));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 403 for parent role", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "parent" },
      error: null,
    });

    const res = await GET(makeRequest({ yearMonth: "2025-01" }));
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 for missing yearMonth query param", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const res = await GET(makeRequest({}));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 for invalid yearMonth format", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const res = await GET(makeRequest({ yearMonth: "invalid-date" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 500 on DB fetch error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    mockBillsSelect.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const res = await GET(makeRequest({ yearMonth: "2025-01" }));
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns CSV with correct headers on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    mockBillsSelect.mockResolvedValue({
      data: [
        {
          id: "1",
          total_amount: 50000,
          year_month: "2025-01",
          total_extended_minutes: 100,
          status: "confirmed",
          children: { name: "Child 1" },
        },
        {
          id: "2",
          total_amount: 60000,
          year_month: "2025-01",
          total_extended_minutes: 120,
          status: "confirmed",
          children: { name: "Child 2" },
        },
      ],
      error: null,
    });

    const csvContent =
      "児童名,対象月,延長時間(分),合計金額,ステータス\nChild 1,2025-01,100,50000,確定済み\nChild 2,2025-01,120,60000,確定済み";
    mockGenerateBillingCSV.mockReturnValue(csvContent);

    const res = await GET(makeRequest({ yearMonth: "2025-01" }));
    expect(res.status).toBe(200);

    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/csv");

    const body = await res.text();
    expect(body).toContain("児童名");
    expect(body).toContain("対象月");
    expect(body).toContain("合計金額");
  });
});
