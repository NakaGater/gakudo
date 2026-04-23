import { describe, it, expect } from "vitest";
import { isStaff, isAdmin, isEntrance } from "./roles";

describe("isStaff", () => {
  it("returns true for admin", () => {
    expect(isStaff("admin")).toBe(true);
  });

  it("returns true for teacher", () => {
    expect(isStaff("teacher")).toBe(true);
  });

  it("returns true for entrance", () => {
    expect(isStaff("entrance")).toBe(true);
  });

  it("returns false for parent", () => {
    expect(isStaff("parent")).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(isStaff("unknown")).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true for admin", () => {
    expect(isAdmin("admin")).toBe(true);
  });

  it("returns false for teacher", () => {
    expect(isAdmin("teacher")).toBe(false);
  });

  it("returns false for entrance", () => {
    expect(isAdmin("entrance")).toBe(false);
  });

  it("returns false for parent", () => {
    expect(isAdmin("parent")).toBe(false);
  });
});

describe("isEntrance", () => {
  it("returns true for entrance", () => {
    expect(isEntrance("entrance")).toBe(true);
  });

  it("returns false for admin", () => {
    expect(isEntrance("admin")).toBe(false);
  });

  it("returns false for teacher", () => {
    expect(isEntrance("teacher")).toBe(false);
  });

  it("returns false for parent", () => {
    expect(isEntrance("parent")).toBe(false);
  });
});
