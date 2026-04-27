import { describe, it, expect } from "vitest";
import { getRedirectPathForRole } from "./actions.helpers";

describe("getRedirectPathForRole", () => {
  it.each([
    ["admin", "/attendance/dashboard"],
    ["teacher", "/attendance/dashboard"],
    ["entrance", "/attendance/dashboard"],
    // Parent lands on their child's attendance status page, not the
    // announcements list — that's the page they actually want to see
    // first ("did my kid arrive?"), and it matches the sidebar logo
    // link target for parents.
    ["parent", "/attendance/status"],
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

  // Unknown roles fall back to the lowest-privilege dashboard page so
  // that a malformed `profiles.role` value can't accidentally drop the
  // user onto a role-gated page (e.g. /attendance/status redirects
  // non-parents away anyway, but /announcements is safest).
  it("treats unknown roles as the lowest-privilege fallback", () => {
    expect(getRedirectPathForRole("villain")).toBe("/announcements");
  });
});
