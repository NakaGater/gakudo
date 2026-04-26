export const FACILITY_NAME = "星ヶ丘こどもクラブ";

export const QR_CODE = {
  PREFIX: "GK-",
  ALPHABET: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  LENGTH: 8,
} as const;

export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"],
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "権限がありません",
  ADMIN_ONLY: "管理者権限が必要です",
  NOT_FOUND: "見つかりません",
} as const;

export const STORAGE = {
  SIGNED_URL_EXPIRY_SECONDS: 3600,
} as const;

export const CACHE = {
  PUBLIC_PAGE_REVALIDATE: 3600,
} as const;

export const TEXT_LIMITS = {
  NOTIFICATION_BODY_LENGTH: 100,
  PREVIEW_EXCERPT_LENGTH: 100,
} as const;
