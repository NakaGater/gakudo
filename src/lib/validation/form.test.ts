import { describe, expect, it } from "vitest";
import { getEmail, getEnum, getNumber, getString } from "./form";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

describe("getString", () => {
  it("returns the trimmed value when present", () => {
    expect(getString(fd({ name: "  山田  " }), "name")).toEqual({ ok: true, value: "山田" });
  });

  it("rejects when missing (required defaults to true)", () => {
    const result = getString(new FormData(), "name");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/入力/);
  });

  it("rejects empty string when required", () => {
    expect(getString(fd({ name: "   " }), "name").ok).toBe(false);
  });

  it("returns empty string when not required", () => {
    expect(getString(new FormData(), "note", { required: false })).toEqual({ ok: true, value: "" });
  });

  it("preserves whitespace when trim is false", () => {
    expect(getString(fd({ name: "  山田  " }), "name", { trim: false })).toEqual({
      ok: true,
      value: "  山田  ",
    });
  });

  it("enforces min length", () => {
    expect(getString(fd({ name: "ab" }), "name", { min: 3 }).ok).toBe(false);
  });

  it("enforces max length", () => {
    expect(getString(fd({ name: "あ".repeat(51) }), "name", { max: 50 }).ok).toBe(false);
  });

  it("uses caller-supplied message when provided", () => {
    const r = getString(new FormData(), "name", { message: "お名前を入れて" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("お名前を入れて");
  });
});

describe("getNumber", () => {
  it("parses a numeric string", () => {
    expect(getNumber(fd({ rate: "500" }), "rate")).toEqual({ ok: true, value: 500 });
  });

  it("rejects non-numeric strings", () => {
    expect(getNumber(fd({ rate: "abc" }), "rate").ok).toBe(false);
  });

  it("rejects empty when required", () => {
    expect(getNumber(fd({ rate: "" }), "rate").ok).toBe(false);
  });

  it("enforces min/max", () => {
    expect(getNumber(fd({ rate: "0" }), "rate", { min: 1 }).ok).toBe(false);
    expect(getNumber(fd({ rate: "10" }), "rate", { max: 5 }).ok).toBe(false);
  });

  it("rejects non-integers when integer:true", () => {
    expect(getNumber(fd({ qty: "1.5" }), "qty", { integer: true }).ok).toBe(false);
    expect(getNumber(fd({ qty: "2" }), "qty", { integer: true })).toEqual({ ok: true, value: 2 });
  });

  it("rejects Infinity / NaN", () => {
    expect(getNumber(fd({ x: "Infinity" }), "x").ok).toBe(false);
    expect(getNumber(fd({ x: "NaN" }), "x").ok).toBe(false);
  });
});

describe("getEnum", () => {
  const ROLES = ["parent", "teacher", "admin", "entrance"] as const;

  it("admits a value in the allow-list", () => {
    expect(getEnum(fd({ role: "admin" }), "role", ROLES)).toEqual({ ok: true, value: "admin" });
  });

  it("rejects a value outside the allow-list", () => {
    expect(getEnum(fd({ role: "villain" }), "role", ROLES).ok).toBe(false);
  });

  it("uses default when missing and default provided", () => {
    expect(getEnum(new FormData(), "role", ROLES, { default: "parent" })).toEqual({
      ok: true,
      value: "parent",
    });
  });
});

describe("getEmail", () => {
  it("admits a well-formed address", () => {
    expect(getEmail(fd({ email: "user@example.com" }), "email")).toEqual({
      ok: true,
      value: "user@example.com",
    });
  });

  it.each(["not-an-email", "missing@dot", "@no-local.com", "spaces in@email.com"])(
    "rejects %s",
    (bad) => {
      expect(getEmail(fd({ email: bad }), "email").ok).toBe(false);
    },
  );

  it("trims whitespace before validating", () => {
    expect(getEmail(fd({ email: "  user@example.com  " }), "email")).toEqual({
      ok: true,
      value: "user@example.com",
    });
  });
});
