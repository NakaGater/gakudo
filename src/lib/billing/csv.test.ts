import { describe, it, expect } from "vitest";
import { generateBillingCSV } from "./csv";

type BillForCSV = {
  child_name: string;
  year_month: string;
  total_extended_minutes: number;
  total_amount: number;
  status: string;
};

describe("generateBillingCSV", () => {
  it("should generate CSV with BOM header", () => {
    const csv = generateBillingCSV([]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("should include correct column headers", () => {
    const csv = generateBillingCSV([]);
    const lines = csv.replace("\uFEFF", "").split("\n");
    expect(lines[0]).toBe("児童名,対象月,延長時間(分),合計金額,ステータス");
  });

  it("should map draft status to 未確定", () => {
    const bills: BillForCSV[] = [
      {
        child_name: "田中太郎",
        year_month: "2025-01",
        total_extended_minutes: 60,
        total_amount: 500,
        status: "draft",
      },
    ];
    const csv = generateBillingCSV(bills);
    const lines = csv.replace("\uFEFF", "").split("\n");
    expect(lines[1]).toBe("田中太郎,2025-01,60,500,未確定");
  });

  it("should map confirmed status to 確定済み", () => {
    const bills: BillForCSV[] = [
      {
        child_name: "鈴木花子",
        year_month: "2025-02",
        total_extended_minutes: 120,
        total_amount: 1000,
        status: "confirmed",
      },
    ];
    const csv = generateBillingCSV(bills);
    const lines = csv.replace("\uFEFF", "").split("\n");
    expect(lines[1]).toBe("鈴木花子,2025-02,120,1000,確定済み");
  });

  it("should handle empty array", () => {
    const csv = generateBillingCSV([]);
    const lines = csv.replace("\uFEFF", "").split("\n").filter(Boolean);
    expect(lines).toHaveLength(1); // header only
  });

  it("should handle multiple bills", () => {
    const bills: BillForCSV[] = [
      {
        child_name: "田中太郎",
        year_month: "2025-01",
        total_extended_minutes: 60,
        total_amount: 500,
        status: "draft",
      },
      {
        child_name: "鈴木花子",
        year_month: "2025-01",
        total_extended_minutes: 0,
        total_amount: 0,
        status: "confirmed",
      },
    ];
    const csv = generateBillingCSV(bills);
    const lines = csv.replace("\uFEFF", "").split("\n").filter(Boolean);
    expect(lines).toHaveLength(3); // header + 2 rows
  });
});
