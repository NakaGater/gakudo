import { describe, it, expect } from "vitest";
import {
  parseEndTimeToMinutes,
  jstMinutesFromUTC,
  calculateExtendedMinutes,
  summarizeBill,
} from "./calculate.helpers";
import type { BillingRule } from "@/app/(dashboard)/billing/types";

const rule: BillingRule = {
  id: "rule-1",
  regular_end_time: "18:00:00",
  rate_per_unit: 100,
  unit_minutes: 30,
  effective_from: "2025-01-01",
  created_at: "2025-01-01T00:00:00Z",
};

describe("parseEndTimeToMinutes", () => {
  it.each([
    ["00:00:00", 0],
    ["18:00:00", 1080],
    ["18:30:00", 1110],
    ["23:59:59", 1439],
  ])("%s → %d", (hhmm, expected) => {
    expect(parseEndTimeToMinutes(hhmm)).toBe(expected);
  });
});

describe("jstMinutesFromUTC", () => {
  it("converts UTC 09:00 to JST 18:00 = 1080", () => {
    expect(jstMinutesFromUTC("2025-01-10T09:00:00Z")).toBe(1080);
  });

  it("converts UTC 08:30 to JST 17:30 = 1050", () => {
    expect(jstMinutesFromUTC("2025-01-10T08:30:00Z")).toBe(1050);
  });

  it("preserves overnight values: UTC 15:30 → JST 24:30 = 1470 (NOT modulo 1440)", () => {
    // 退室時刻が JST 翌日 00:30 でも「閉所からの累積分」として 1470 を保つ
    expect(jstMinutesFromUTC("2025-01-10T15:30:00Z")).toBe(1470);
  });
});

describe("calculateExtendedMinutes", () => {
  it("returns positive diff", () => {
    expect(calculateExtendedMinutes(1110, 1080)).toBe(30);
  });

  it("returns 0 when exit is exactly at end time", () => {
    expect(calculateExtendedMinutes(1080, 1080)).toBe(0);
  });

  it("returns 0 when exit is before end time (no negative)", () => {
    expect(calculateExtendedMinutes(1050, 1080)).toBe(0);
  });
});

describe("summarizeBill", () => {
  it("returns zero totals when no exit records", () => {
    expect(summarizeBill([], rule)).toEqual({ totalExtendedMinutes: 0, totalAmount: 0 });
  });

  it("ignores 'enter' records", () => {
    expect(summarizeBill([{ type: "enter", recorded_at: "2025-01-10T00:00:00Z" }], rule)).toEqual({
      totalExtendedMinutes: 0,
      totalAmount: 0,
    });
  });

  it("ignores exit records without recorded_at", () => {
    expect(summarizeBill([{ type: "exit", recorded_at: null }], rule)).toEqual({
      totalExtendedMinutes: 0,
      totalAmount: 0,
    });
  });

  it("returns 0 amount when exit is before regular end", () => {
    // 17:30 JST = 08:30 UTC, 通常終了は 18:00 → 延長 0
    expect(summarizeBill([{ type: "exit", recorded_at: "2025-01-10T08:30:00Z" }], rule)).toEqual({
      totalExtendedMinutes: 0,
      totalAmount: 0,
    });
  });

  it("charges 1 unit (100円) for exactly 30 min extension", () => {
    // 18:30 JST = 09:30 UTC, +30 分 → ceil(30/30) = 1 unit
    expect(summarizeBill([{ type: "exit", recorded_at: "2025-01-10T09:30:00Z" }], rule)).toEqual({
      totalExtendedMinutes: 30,
      totalAmount: 100,
    });
  });

  it("rounds 45 min up to 2 units (200円)", () => {
    // 18:45 JST = 09:45 UTC, +45 分 → ceil(45/30) = 2 units
    expect(summarizeBill([{ type: "exit", recorded_at: "2025-01-10T09:45:00Z" }], rule)).toEqual({
      totalExtendedMinutes: 45,
      totalAmount: 200,
    });
  });

  it("accumulates extended minutes across multiple exits", () => {
    const result = summarizeBill(
      [
        { type: "exit", recorded_at: "2025-01-10T09:30:00Z" }, // +30
        { type: "exit", recorded_at: "2025-01-11T10:00:00Z" }, // +60
        { type: "exit", recorded_at: "2025-01-12T08:50:00Z" }, // +0 (17:50 JST)
      ],
      rule,
    );
    expect(result).toEqual({ totalExtendedMinutes: 90, totalAmount: 300 });
  });

  it("handles overnight exits (JST 翌日 00:30) without modulo collapse", () => {
    // UTC 15:30 = JST 翌日 00:30 → 通常終了 18:00 から 6.5 時間 (390 分) 延長
    const result = summarizeBill([{ type: "exit", recorded_at: "2025-01-10T15:30:00Z" }], rule);
    expect(result.totalExtendedMinutes).toBe(390);
    expect(result.totalAmount).toBe(100 * Math.ceil(390 / 30)); // 1300
  });

  it("respects custom unit_minutes / rate_per_unit from the rule", () => {
    const customRule: BillingRule = { ...rule, unit_minutes: 15, rate_per_unit: 60 };
    // 20 分延長 → ceil(20/15) = 2 units × 60 = 120
    expect(
      summarizeBill([{ type: "exit", recorded_at: "2025-01-10T09:20:00Z" }], customRule),
    ).toEqual({ totalExtendedMinutes: 20, totalAmount: 120 });
  });
});
