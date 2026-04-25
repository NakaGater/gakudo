import { describe, it, expect } from "vitest";
import {
  buildAttendanceMaps,
  toDashboardStatuses,
  decideNextAttendanceType,
} from "./actions.helpers";

describe("decideNextAttendanceType", () => {
  it("returns 'enter' when there is no prior record", () => {
    expect(decideNextAttendanceType(null)).toBe("enter");
    expect(decideNextAttendanceType(undefined)).toBe("enter");
  });

  it("returns 'enter' when last record is exit (re-enter)", () => {
    expect(decideNextAttendanceType({ type: "exit" })).toBe("enter");
  });

  it("returns 'exit' when last record is enter", () => {
    expect(decideNextAttendanceType({ type: "enter" })).toBe("exit");
  });
});

describe("buildAttendanceMaps", () => {
  it("returns empty maps for empty input", () => {
    const { enterMap, latestMap } = buildAttendanceMaps([]);
    expect(enterMap.size).toBe(0);
    expect(latestMap.size).toBe(0);
  });

  it("preserves only the FIRST enter per child", () => {
    const { enterMap } = buildAttendanceMaps([
      { child_id: "c1", type: "enter", recorded_at: "2024-01-15T01:00:00Z" },
      { child_id: "c1", type: "enter", recorded_at: "2024-01-15T03:00:00Z" }, // ignored
    ]);
    expect(enterMap.get("c1")).toBe("2024-01-15T01:00:00Z");
  });

  it("tracks the most recent record per child in latestMap", () => {
    const { latestMap } = buildAttendanceMaps([
      { child_id: "c1", type: "enter", recorded_at: "2024-01-15T01:00:00Z" },
      { child_id: "c1", type: "exit", recorded_at: "2024-01-15T09:00:00Z" },
    ]);
    expect(latestMap.get("c1")).toEqual({
      type: "exit",
      recorded_at: "2024-01-15T09:00:00Z",
    });
  });

  it("handles multiple children independently", () => {
    const { enterMap, latestMap } = buildAttendanceMaps([
      { child_id: "c1", type: "enter", recorded_at: "2024-01-15T01:00:00Z" },
      { child_id: "c2", type: "enter", recorded_at: "2024-01-15T02:00:00Z" },
      { child_id: "c2", type: "exit", recorded_at: "2024-01-15T08:00:00Z" },
    ]);
    expect(enterMap.size).toBe(2);
    expect(latestMap.get("c1")?.type).toBe("enter");
    expect(latestMap.get("c2")?.type).toBe("exit");
  });
});

describe("toDashboardStatuses", () => {
  const children = [
    { id: "c1", name: "太郎", grade: 3 },
    { id: "c2", name: "花子", grade: 4 },
    { id: "c3", name: "次郎", grade: 5 },
  ];

  it("marks children with no records as 'none'", () => {
    const result = toDashboardStatuses(children, new Map(), new Map());
    expect(result).toEqual([
      { childId: "c1", name: "太郎", grade: 3, status: "none", enterTime: null, exitTime: null },
      { childId: "c2", name: "花子", grade: 4, status: "none", enterTime: null, exitTime: null },
      { childId: "c3", name: "次郎", grade: 5, status: "none", enterTime: null, exitTime: null },
    ]);
  });

  it("marks the last 'enter' as 'entered' with enterTime set", () => {
    const enterMap = new Map([["c1", "2024-01-15T01:00:00Z"]]);
    const latestMap = new Map([["c1", { type: "enter", recorded_at: "2024-01-15T01:00:00Z" }]]);
    const [c1] = toDashboardStatuses(children, enterMap, latestMap);
    expect(c1).toEqual({
      childId: "c1",
      name: "太郎",
      grade: 3,
      status: "entered",
      enterTime: "2024-01-15T01:00:00Z",
      exitTime: null,
    });
  });

  it("marks the last 'exit' as 'exited' with both enterTime and exitTime set", () => {
    const enterMap = new Map([["c2", "2024-01-15T02:00:00Z"]]);
    const latestMap = new Map([["c2", { type: "exit", recorded_at: "2024-01-15T08:00:00Z" }]]);
    const result = toDashboardStatuses(children, enterMap, latestMap);
    const c2 = result.find((r) => r.childId === "c2");
    expect(c2).toEqual({
      childId: "c2",
      name: "花子",
      grade: 4,
      status: "exited",
      enterTime: "2024-01-15T02:00:00Z",
      exitTime: "2024-01-15T08:00:00Z",
    });
  });
});
