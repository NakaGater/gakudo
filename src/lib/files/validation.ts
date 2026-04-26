import { FILE_LIMITS } from "@/config/constants";

type ValidationResult = { valid: true } | { valid: false; message: string };

export function validateFile(file: unknown): ValidationResult {
  if (!(file instanceof File) || file.size === 0) {
    return { valid: false, message: "ファイルを選択してください" };
  }
  if (file.size > FILE_LIMITS.MAX_SIZE_BYTES) {
    return {
      valid: false,
      message: `ファイルサイズは${FILE_LIMITS.MAX_SIZE_BYTES / (1024 * 1024)}MB以下にしてください`,
    };
  }
  return { valid: true };
}

export function validateFileType(
  file: File,
  allowedTypes: readonly string[],
  errorMessage: string,
): ValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: errorMessage };
  }
  return { valid: true };
}

// Magic byte signatures keyed by their corresponding MIME type. Order
// inside each list matters: the first prefix that matches wins. Bytes
// are read once from the start of the file (the longest signature
// length determines how many bytes to read).
const MAGIC_BYTES: Record<string, ReadonlyArray<readonly number[]>> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  // WebP: "RIFF" .. "WEBP" — RIFF at byte 0, "WEBP" at byte 8. We
  // verify both prefixes via a check function below rather than a
  // simple byte-prefix list.
  "image/webp": [],
};

const MAX_PREFIX_BYTES = 12;

function bytesStartWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

function isWebp(bytes: Uint8Array): boolean {
  // bytes[0..3] === "RIFF", bytes[8..11] === "WEBP"
  return (
    bytes.length >= 12 &&
    bytesStartWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

/**
 * Verify the file's first bytes match the MIME type the client claimed.
 *
 * `file.type` comes from the browser and can be spoofed; this catches
 * the common case of an executable renamed to .pdf or .png. Falls
 * through to `validateFileType`-style behavior when the MIME type isn't
 * in the allowed list to start with.
 */
export async function validateFileMagicBytes(
  file: File,
  allowedTypes: readonly string[],
  errorMessage: string,
): Promise<ValidationResult> {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: errorMessage };
  }

  const buf = new Uint8Array(await file.slice(0, MAX_PREFIX_BYTES).arrayBuffer());

  if (file.type === "image/webp") {
    return isWebp(buf) ? { valid: true } : { valid: false, message: errorMessage };
  }

  const signatures = MAGIC_BYTES[file.type];
  if (!signatures || signatures.length === 0) {
    // No signature table for this MIME — fail closed so unknown types
    // can't slip through. Add to MAGIC_BYTES when extending allowed
    // types.
    return { valid: false, message: errorMessage };
  }

  const matches = signatures.some((sig) => bytesStartWith(buf, sig));
  return matches ? { valid: true } : { valid: false, message: errorMessage };
}
