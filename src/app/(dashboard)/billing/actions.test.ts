import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

const mockCalculateMonthlyBill = vi.fn();
vi.mock("@/lib/billing/calculate", () => ({
  calculateMonthlyBill: (...args: unknown[]) => mockCalculateMonthlyBill(...args),
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

import {
  calculateAllBills,
  calculateSingleBill,
  confirmAllBills,
  confirmBill,
  createBillingRule,
  getActiveBillingRule,
  getBillingRules,
} from "./actions";

const setTable = (table: string, resolved: { data: unknown; error: unknown }) => {
  // For tests that need a single fixed response per table.
  holder.current = createSupabaseMock({ tables: { [table]: resolved } });
};

describe("getActiveBillingRule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("returns null for non-admin", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    const result = await getActiveBillingRule();
    expect(result).toBeNull();
  });

  it("returns rule for admin", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const rule = {
      id: "r1",
      regular_end_time: "17:00",
      rate_per_unit: 500,
      unit_minutes: 30,
      effective_from: "2025-01-01",
    };
    setTable("billing_rules", { data: rule, error: null });

    const result = await getActiveBillingRule();
    expect(result).toEqual(rule);
  });
});

describe("getBillingRules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("returns empty for non-admin", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    const result = await getBillingRules();
    expect(result).toEqual([]);
  });
});

describe("createBillingRule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-admin", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    const result = await createBillingRule(null, new FormData());
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("権限");
  });

  it("validates all required fields", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();

    const result = await createBillingRule(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.fieldErrors?.regular_end_time).toBeTruthy();
    expect(result?.fieldErrors?.rate_per_unit).toBeTruthy();
    expect(result?.fieldErrors?.unit_minutes).toBeTruthy();
    expect(result?.fieldErrors?.effective_from).toBeTruthy();
  });

  it("validates rate must be positive", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("regular_end_time", "17:00");
    fd.set("rate_per_unit", "0");
    fd.set("unit_minutes", "30");
    fd.set("effective_from", "2025-01-01");

    const result = await createBillingRule(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.fieldErrors?.rate_per_unit).toBeTruthy();
  });

  it("creates rule on valid input", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    setTable("billing_rules", { data: null, error: null });

    const fd = new FormData();
    fd.set("regular_end_time", "17:00");
    fd.set("rate_per_unit", "500");
    fd.set("unit_minutes", "30");
    fd.set("effective_from", "2025-01-01");

    const result = await createBillingRule(null, fd);
    expect(result?.success).toBe(true);
    expect(result?.message).toContain("料金ルール");
  });

  it("returns error on DB failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    setTable("billing_rules", { data: null, error: { message: "DB error" } });

    const fd = new FormData();
    fd.set("regular_end_time", "17:00");
    fd.set("rate_per_unit", "500");
    fd.set("unit_minutes", "30");
    fd.set("effective_from", "2025-01-01");

    const result = await createBillingRule(null, fd);
    expect(result?.success).toBe(false);
    // Phase 2-B: raw DB message is sanitized away; only the fallback leaks.
    expect(result?.message).toMatch(/作成に失敗/);
    expect(result?.message).not.toContain("DB error");
  });
});

describe("calculateAllBills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await calculateAllBills("2025-01");
    expect(result.success).toBe(false);
  });

  it("validates yearMonth format", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const result = await calculateAllBills("invalid");
    expect(result.success).toBe(false);
    expect(result.message).toContain("YYYY-MM");
  });

  it("calculates bills for all children", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    setTable("children", { data: [{ id: "c1" }, { id: "c2" }], error: null });
    mockCalculateMonthlyBill.mockResolvedValue({ totalAmount: 1000 });

    const result = await calculateAllBills("2025-01");
    expect(result.success).toBe(true);
    expect(result.processed).toBe(2);
    expect(result.totalAmount).toBe(2000);
  });

  it("allows teacher role", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    setTable("children", { data: [{ id: "c1" }], error: null });
    mockCalculateMonthlyBill.mockResolvedValue({ totalAmount: 500 });

    const result = await calculateAllBills("2025-01");
    expect(result.success).toBe(true);
  });
});

describe("confirmBill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await confirmBill("bill-1");
    expect(result.success).toBe(false);
  });

  it("confirms a draft bill", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    setTable("monthly_bills", { data: null, error: null });

    const result = await confirmBill("bill-1");
    expect(result.success).toBe(true);
    expect(result.message).toContain("確定");
  });
});

describe("confirmAllBills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await confirmAllBills("2025-01");
    expect(result.success).toBe(false);
  });

  it("validates yearMonth format", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const result = await confirmAllBills("bad");
    expect(result.success).toBe(false);
    expect(result.message).toContain("YYYY-MM");
  });

  it("confirms all draft bills for month", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    setTable("monthly_bills", { data: [{ id: "b1" }, { id: "b2" }], error: null });

    const result = await confirmAllBills("2025-01");
    expect(result.success).toBe(true);
    expect(result.confirmed).toBe(2);
  });
});

describe("calculateSingleBill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await calculateSingleBill("c1", "2025-01");
    expect(result.success).toBe(false);
  });

  it("validates yearMonth format", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const result = await calculateSingleBill("c1", "bad");
    expect(result.success).toBe(false);
  });

  it("calculates bill for single child", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockCalculateMonthlyBill.mockResolvedValue({ totalAmount: 1500 });

    const result = await calculateSingleBill("c1", "2025-01");
    expect(result.success).toBe(true);
    expect(result.message).toContain("完了");
  });

  it("returns error on calculation failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockCalculateMonthlyBill.mockRejectedValue(new Error("INTERNAL_SCHEMA_LEAK"));

    const result = await calculateSingleBill("c1", "2025-01");
    expect(result.success).toBe(false);
    // Phase 2-B: thrown error message must not leak to the user.
    expect(result.message).toMatch(/計算エラー/);
    expect(result.message).not.toContain("INTERNAL_SCHEMA_LEAK");
  });
});
