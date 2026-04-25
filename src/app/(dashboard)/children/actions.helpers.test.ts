import { describe, it, expect } from "vitest";
import { validateChildForm } from "./actions.helpers";

function buildForm(fields: Record<string, string | undefined>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) fd.set(k, v);
  }
  return fd;
}

describe("validateChildForm", () => {
  it("rejects when name is missing", () => {
    const result = validateChildForm(buildForm({ grade: "3" }));
    expect(result).toEqual({
      ok: false,
      error: { success: false, message: "名前を入力してください" },
    });
  });

  it("rejects when name is whitespace only", () => {
    const result = validateChildForm(buildForm({ name: "   ", grade: "3" }));
    expect(result).toEqual({
      ok: false,
      error: { success: false, message: "名前を入力してください" },
    });
  });

  it("trims surrounding whitespace from name", () => {
    const result = validateChildForm(buildForm({ name: "  花子  ", grade: "3" }));
    expect(result).toEqual({ ok: true, name: "花子", grade: 3 });
  });

  it("rejects non-integer grade", () => {
    const result = validateChildForm(buildForm({ name: "太郎", grade: "abc" }));
    expect(result).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining("学年") },
    });
  });

  it("rejects fractional grade", () => {
    const result = validateChildForm(buildForm({ name: "太郎", grade: "3.5" }));
    expect(result).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining("学年") },
    });
  });

  it.each([
    ["0", false],
    ["1", true],
    ["6", true],
    ["7", false],
  ])("grade=%s → ok=%s", (gradeStr, ok) => {
    const result = validateChildForm(buildForm({ name: "太郎", grade: gradeStr }));
    expect(result.ok).toBe(ok);
  });

  it("returns parsed grade as a number, not a string", () => {
    const result = validateChildForm(buildForm({ name: "太郎", grade: "4" }));
    expect(result).toEqual({ ok: true, name: "太郎", grade: 4 });
  });
});
