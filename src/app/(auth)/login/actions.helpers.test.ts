import { describe, it, expect } from "vitest";
import { getRedirectPathForRole } from "./actions.helpers";

describe("getRedirectPathForRole", () => {
  it.each([
    ["admin", "/attendance/dashboard"],
    ["teacher", "/attendance/dashboard"],
    ["entrance", "/attendance/dashboard"],
    ["parent", "/announcements"],
    ["", "/announcements"],
  ])("role=%s → %s", (role, expected) => {
    expect(getRedirectPathForRole(role)).toBe(expected);
  });

  it("falls back to /announcements when role is undefined", () => {
    expect(getRedirectPathForRole(undefined)).toBe("/announcements");
  });

  it("falls back to /announcements when role is null", () => {
    expect(getRedirectPathForRole(null)).toBe("/announcements");
  });

  it("treats unknown roles as parent (no escalation)", () => {
    expect(getRedirectPathForRole("villain")).toBe("/announcements");
  });
});
