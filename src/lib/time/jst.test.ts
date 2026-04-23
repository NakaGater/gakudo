import { describe, it, expect } from "vitest";
import { formatTimeJST, todayRangeJST, currentYearMonthJST, formatDateJST } from "./jst";

describe("formatTimeJST", () => {
  it("returns '—' for null", () => {
    expect(formatTimeJST(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatTimeJST(undefined)).toBe("—");
  });

  it("returns '—' for empty string", () => {
    expect(formatTimeJST("")).toBe("—");
  });

  it("formats ISO timestamp to HH:MM in JST", () => {
    // 2025-01-15T00:30:00Z = 2025-01-15T09:30:00+09:00 in JST
    const result = formatTimeJST("2025-01-15T00:30:00Z");
    expect(result).toBe("09:30");
  });

  it("formats midnight UTC correctly", () => {
    // 2025-06-01T00:00:00Z = 2025-06-01T09:00:00+09:00 in JST
    const result = formatTimeJST("2025-06-01T00:00:00Z");
    expect(result).toBe("09:00");
  });
});

describe("todayRangeJST", () => {
  it("returns start and end as ISO strings", () => {
    const { start, end } = todayRangeJST();
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("has exactly 24 hours between start and end", () => {
    const { start, end } = todayRangeJST();
    const diff = new Date(end).getTime() - new Date(start).getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000);
  });
});

describe("currentYearMonthJST", () => {
  it("returns YYYY-MM format", () => {
    const result = currentYearMonthJST();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it("returns a valid year and month", () => {
    const result = currentYearMonthJST();
    const [year, month] = result.split("-").map(Number);
    expect(year).toBeGreaterThanOrEqual(2024);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });
});

describe("formatDateJST", () => {
  it("formats a date to YYYY-MM-DD", () => {
    const d = new Date("2025-03-05T00:00:00Z");
    expect(formatDateJST(d)).toBe("2025-03-05");
  });

  it("pads month and day with zero", () => {
    const d = new Date("2025-01-09T00:00:00Z");
    // formatDateJST uses padStart(2, "0") so it should pad
    expect(formatDateJST(d)).toBe("2025-01-09");
  });

  it("handles end of year correctly", () => {
    const d = new Date("2025-12-31T00:00:00Z");
    expect(formatDateJST(d)).toBe("2025-12-31");
  });
});
