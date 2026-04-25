import { describe, it, expect } from "vitest";
import { FILE_LIMITS } from "@/config/constants";
import { validateFile, validateFileMagicBytes, validateFileType } from "./validation";

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
    const exact = new File([new Uint8Array(FILE_LIMITS.MAX_SIZE_BYTES)], "exact.pdf", {
      type: "application/pdf",
    });
    expect(validateFile(exact)).toEqual({ valid: true });
  });

  it("rejects files larger than MAX_SIZE_BYTES", () => {
    const oversized = new File([new Uint8Array(FILE_LIMITS.MAX_SIZE_BYTES + 1)], "big.pdf", {
      type: "application/pdf",
    });
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
    expect(validateFileType(pdf, allowed, "PDF または画像ファイルを選択してください")).toEqual({
      valid: true,
    });
  });

  it("rejects a file whose mime is not in the allowed list", () => {
    const exe = new File(["x"], "bad.exe", { type: "application/x-msdownload" });
    expect(validateFileType(exe, allowed, "PDF または画像ファイルを選択してください")).toEqual({
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

describe("validateFileMagicBytes", () => {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ] as const;

  function fileWith(bytes: number[], type: string, name = "blob"): File {
    return new File([new Uint8Array(bytes)], name, { type });
  }

  it("rejects when claimed MIME is not in the allowed list", async () => {
    const exe = fileWith([0x4d, 0x5a], "application/x-msdownload", "evil.exe");
    const result = await validateFileMagicBytes(exe, allowed, "ngくない");
    expect(result).toEqual({ valid: false, message: "ngくない" });
  });

  it("accepts a real PDF (%PDF prefix)", async () => {
    const pdf = fileWith([0x25, 0x50, 0x44, 0x46, 0x2d], "application/pdf", "doc.pdf");
    expect(await validateFileMagicBytes(pdf, allowed, "ng")).toEqual({ valid: true });
  });

  it("rejects a renamed executable claiming application/pdf", async () => {
    const fake = fileWith([0x4d, 0x5a, 0x90, 0x00], "application/pdf", "evil.pdf");
    expect(await validateFileMagicBytes(fake, allowed, "ng")).toEqual({
      valid: false,
      message: "ng",
    });
  });

  it("accepts a real JPEG (FFD8FF prefix)", async () => {
    const jpg = fileWith([0xff, 0xd8, 0xff, 0xe0], "image/jpeg", "p.jpg");
    expect(await validateFileMagicBytes(jpg, allowed, "ng")).toEqual({ valid: true });
  });

  it("accepts a real PNG (89504E47…)", async () => {
    const png = fileWith(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00],
      "image/png",
      "p.png",
    );
    expect(await validateFileMagicBytes(png, allowed, "ng")).toEqual({ valid: true });
  });

  it("accepts both GIF87a and GIF89a", async () => {
    const gif87 = fileWith([0x47, 0x49, 0x46, 0x38, 0x37, 0x61], "image/gif", "g.gif");
    const gif89 = fileWith([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], "image/gif", "g.gif");
    expect(await validateFileMagicBytes(gif87, allowed, "ng")).toEqual({ valid: true });
    expect(await validateFileMagicBytes(gif89, allowed, "ng")).toEqual({ valid: true });
  });

  it("accepts a real WEBP (RIFF…WEBP)", async () => {
    const webp = fileWith(
      [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x00],
      "image/webp",
      "p.webp",
    );
    expect(await validateFileMagicBytes(webp, allowed, "ng")).toEqual({ valid: true });
  });

  it("rejects WEBP container with wrong inner FourCC", async () => {
    const fake = fileWith(
      [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45, 0x00],
      "image/webp",
      "audio.webp",
    );
    expect(await validateFileMagicBytes(fake, allowed, "ng")).toEqual({
      valid: false,
      message: "ng",
    });
  });

  it("rejects empty content even when MIME matches", async () => {
    const empty = new File([], "p.png", { type: "image/png" });
    expect(await validateFileMagicBytes(empty, allowed, "ng")).toEqual({
      valid: false,
      message: "ng",
    });
  });
});
