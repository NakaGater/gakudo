import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  AttendanceHistoryClient,
  calcDuration,
  formatTime,
  type DayRecord,
  type ChildOption,
} from "./attendance-history-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
});

const defaultChildren: ChildOption[] = [
  { id: "c1", name: "山田太郎" },
  { id: "c2", name: "山田花子" },
];

function renderHistory(overrides?: {
  days?: DayRecord[];
  children?: ChildOption[];
  isStaff?: boolean;
}) {
  const props = {
    days: overrides?.days ?? [],
    children: overrides?.children ?? defaultChildren,
    startDate: "2024-06-10",
    endDate: "2024-06-16",
    selectedChildId: "",
    isStaff: overrides?.isStaff ?? false,
    ...overrides,
  };
  return render(<AttendanceHistoryClient {...props} />);
}

describe("AttendanceHistoryClient", () => {
  it("renders date filter inputs", () => {
    renderHistory();

    const startInput = screen.getByLabelText("開始日");
    expect(startInput).toBeInTheDocument();
    expect(startInput).toHaveAttribute("type", "date");
    expect(startInput).toHaveValue("2024-06-10");

    const endInput = screen.getByLabelText("終了日");
    expect(endInput).toBeInTheDocument();
    expect(endInput).toHaveAttribute("type", "date");
    expect(endInput).toHaveValue("2024-06-16");
  });

  it("renders child filter when multiple children", () => {
    renderHistory();

    const select = screen.getByLabelText("児童");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("山田花子")).toBeInTheDocument();
  });

  it("hides child filter when single child", () => {
    renderHistory({ children: [{ id: "c1", name: "山田太郎" }] });

    expect(screen.queryByLabelText("児童")).not.toBeInTheDocument();
  });

  it("renders attendance records with times", () => {
    const days: DayRecord[] = [
      {
        date: "2024-06-10",
        pairs: [
          {
            enterTime: "2024-06-10T05:00:00Z", // 14:00 JST
            exitTime: "2024-06-10T08:30:00Z", // 17:30 JST
          },
        ],
      },
    ];

    renderHistory({ days });

    // Date label appears in both desktop table and mobile card
    expect(screen.getAllByText("6/10 (月)").length).toBeGreaterThanOrEqual(1);
    // Duration should appear (3h30m)
    expect(screen.getAllByText("3時間30分").length).toBeGreaterThanOrEqual(1);
  });

  it("shows 記録なし for empty days", () => {
    const days: DayRecord[] = [
      { date: "2024-06-11", pairs: [] },
    ];

    renderHistory({ days });

    expect(screen.getAllByText("6/11 (火)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("記録なし").length).toBeGreaterThanOrEqual(1);
  });

  it("renders page title", () => {
    renderHistory();
    expect(
      screen.getByRole("heading", { name: "入退室履歴" }),
    ).toBeInTheDocument();
  });
});

describe("calcDuration", () => {
  it("returns formatted duration for valid pair", () => {
    expect(
      calcDuration("2024-06-10T05:00:00Z", "2024-06-10T08:25:00Z"),
    ).toBe("3時間25分");
  });

  it("returns hours and 0 minutes correctly", () => {
    expect(
      calcDuration("2024-06-10T05:00:00Z", "2024-06-10T07:00:00Z"),
    ).toBe("2時間0分");
  });

  it("returns minutes only when less than 1 hour", () => {
    expect(
      calcDuration("2024-06-10T05:00:00Z", "2024-06-10T05:45:00Z"),
    ).toBe("45分");
  });

  it("returns — when enter is null", () => {
    expect(calcDuration(null, "2024-06-10T08:25:00Z")).toBe("—");
  });

  it("returns — when exit is null", () => {
    expect(calcDuration("2024-06-10T05:00:00Z", null)).toBe("—");
  });

  it("returns — when both are null", () => {
    expect(calcDuration(null, null)).toBe("—");
  });
});

describe("formatTime", () => {
  it("returns — for null", () => {
    expect(formatTime(null)).toBe("—");
  });

  it("formats ISO string to HH:mm in JST", () => {
    // 2024-06-10T05:00:00Z = 14:00 JST
    const result = formatTime("2024-06-10T05:00:00Z");
    expect(result).toBe("14:00");
  });
});
