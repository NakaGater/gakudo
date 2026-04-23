import { FILE_LIMITS } from "@/config/constants";

type ValidationResult = { valid: true } | { valid: false; message: string };

export function validateFile(file: unknown): ValidationResult {
  if (!(file instanceof File) || file.size === 0) {
    return { valid: false, message: "ファイルを選択してください" };
  }
  if (file.size > FILE_LIMITS.MAX_SIZE_BYTES) {
    return { valid: false, message: `ファイルサイズは${FILE_LIMITS.MAX_SIZE_BYTES / (1024 * 1024)}MB以下にしてください` };
  }
  return { valid: true };
}

export function validateFileType(file: File, allowedTypes: readonly string[], errorMessage: string): ValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: errorMessage };
  }
  return { valid: true };
}
