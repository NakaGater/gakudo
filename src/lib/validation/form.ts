/**
 * Result-style FormData accessors so Server Actions don't re-implement
 * `typeof formData.get(...) !== "string"` validation 15 times.
 *
 * Each helper returns:
 *   { ok: true,  value: T }
 *   { ok: false, error: string }   — caller-friendly Japanese message
 *
 * Designed to be Zod-shape-compatible so a future migration to Zod
 * can collapse this layer without touching callsites that destructure
 * `result.value` / `result.error`.
 */

export type FormResult<T> = { ok: true; value: T } | { ok: false; error: string };

type StringOpts = {
  /** Default true. Pass `false` to allow empty strings (returned as-is). */
  required?: boolean | undefined;
  /** Default true. Strips leading/trailing whitespace before checks. */
  trim?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  /** Custom rejection message. Defaults to a generic "を入力してください". */
  message?: string | undefined;
};

export function getString(fd: FormData, key: string, opts: StringOpts = {}): FormResult<string> {
  const required = opts.required ?? true;
  const trim = opts.trim ?? true;
  const raw = fd.get(key);

  if (raw === null) {
    if (!required) return { ok: true, value: "" };
    return { ok: false, error: opts.message ?? `${key}を入力してください` };
  }

  if (typeof raw !== "string") {
    return { ok: false, error: opts.message ?? `${key}を入力してください` };
  }

  const value = trim ? raw.trim() : raw;

  if (required && !value) {
    return { ok: false, error: opts.message ?? `${key}を入力してください` };
  }

  if (opts.min !== undefined && value.length < opts.min) {
    return {
      ok: false,
      error: opts.message ?? `${key}は${opts.min}文字以上で入力してください`,
    };
  }

  if (opts.max !== undefined && value.length > opts.max) {
    return {
      ok: false,
      error: opts.message ?? `${key}は${opts.max}文字以内で入力してください`,
    };
  }

  return { ok: true, value };
}

type NumberOpts = {
  required?: boolean;
  min?: number;
  max?: number;
  /** Default false. When true, only accepts integers. */
  integer?: boolean;
  message?: string;
};

export function getNumber(fd: FormData, key: string, opts: NumberOpts = {}): FormResult<number> {
  const required = opts.required ?? true;
  const raw = fd.get(key);

  if (raw === null || raw === "") {
    if (!required) return { ok: true, value: NaN };
    return { ok: false, error: opts.message ?? `${key}を入力してください` };
  }

  if (typeof raw !== "string") {
    return { ok: false, error: opts.message ?? `${key}を入力してください` };
  }

  const num = Number(raw);
  if (!Number.isFinite(num)) {
    return { ok: false, error: opts.message ?? `${key}は数値で入力してください` };
  }

  if (opts.integer && !Number.isInteger(num)) {
    return { ok: false, error: opts.message ?? `${key}は整数で入力してください` };
  }

  if (opts.min !== undefined && num < opts.min) {
    return { ok: false, error: opts.message ?? `${key}は${opts.min}以上で入力してください` };
  }

  if (opts.max !== undefined && num > opts.max) {
    return { ok: false, error: opts.message ?? `${key}は${opts.max}以下で入力してください` };
  }

  return { ok: true, value: num };
}

type EnumOpts<T extends string> = {
  required?: boolean;
  default?: T;
  message?: string;
};

export function getEnum<T extends string>(
  fd: FormData,
  key: string,
  values: readonly T[],
  opts: EnumOpts<T> = {},
): FormResult<T> {
  const raw = fd.get(key);
  if (raw === null) {
    if (opts.default !== undefined) return { ok: true, value: opts.default };
    if (opts.required === false) return { ok: false, error: "" };
    return { ok: false, error: opts.message ?? `${key}を選択してください` };
  }
  if (typeof raw !== "string" || !(values as readonly string[]).includes(raw)) {
    return { ok: false, error: opts.message ?? `有効な${key}を選択してください` };
  }
  return { ok: true, value: raw as T };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getEmail(
  fd: FormData,
  key: string,
  opts: { required?: boolean; message?: string } = {},
): FormResult<string> {
  const str = getString(fd, key, { required: opts.required ?? true, message: opts.message });
  if (!str.ok) return str;
  if (str.value === "") return str; // optional + empty
  if (!EMAIL_RE.test(str.value)) {
    return {
      ok: false,
      error: opts.message ?? `有効なメールアドレスを入力してください`,
    };
  }
  return { ok: true, value: str.value };
}
