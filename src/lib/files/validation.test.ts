import { describe, it, expect } from "vitest";
import { validateFile, validateFileType } from "./validation";
import { FILE_LIMITS } from "@/config/constants";

describe("validateFile", () => {
  it("rejects non-File values", () => {
    expect(validateFile(null)).toEqual({
      valid: false,
      message: "ファイルを選択してください",
    });
    expect(validateFile(undefined)).toEqual({
      valid: false,
      message: "ファイルを選択してください",
    });
    expect(validateFile("not a file")).toEqual({
      valid: false,
      message: "ファイルを選択してください",
    });
  });

  it("rejects zero-size files", () => {
    const empty = new File([], "empty.pdf", { type: "application/pdf" });
    expect(validateFile(empty)).toEqual({
      valid: false,
      message: "ファイルを選択してください",
    });
  });

  it("accepts a file at exactly MAX_SIZE_BYTES", () => {
    const exact = new File(
      [new Uint8Array(FILE_LIMITS.MAX_SIZE_BYTES)],
      "exact.pdf",
      { type: "application/pdf" },
    );
    expect(validateFile(exact)).toEqual({ valid: true });
  });

  it("rejects files larger than MAX_SIZE_BYTES", () => {
    const oversized = new File(
      [new Uint8Array(FILE_LIMITS.MAX_SIZE_BYTES + 1)],
      "big.pdf",
      { type: "application/pdf" },
    );
    const result = validateFile(oversized);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toContain("10MB");
    }
  });

  it("accepts a typical small file", () => {
    const small = new File(["hello"], "ok.pdf", { type: "application/pdf" });
    expect(validateFile(small)).toEqual({ valid: true });
  });
});

describe("validateFileType", () => {
  const allowed = ["application/pdf", "image/png"] as const;

  it("accepts a file whose mime is in the allowed list", () => {
    const pdf = new File(["x"], "doc.pdf", { type: "application/pdf" });
    expect(validateFileType(pdf, allowed, "PDF または画像ファイルを選択してください"))
      .toEqual({ valid: true });
  });

  it("rejects a file whose mime is not in the allowed list", () => {
    const exe = new File(["x"], "bad.exe", { type: "application/x-msdownload" });
    expect(
      validateFileType(exe, allowed, "PDF または画像ファイルを選択してください"),
    ).toEqual({
      valid: false,
      message: "PDF または画像ファイルを選択してください",
    });
  });

  it("returns the caller-supplied error message verbatim", () => {
    const txt = new File(["x"], "note.txt", { type: "text/plain" });
    const result = validateFileType(txt, allowed, "カスタムなメッセージ");
    expect(result).toEqual({ valid: false, message: "カスタムなメッセージ" });
  });
});
