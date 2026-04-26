const REQUIRED_ENV_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

const REQUIRED_SERVER_ENV_VARS = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

// Optional but warn if missing
const OPTIONAL_ENV_VARS = [
  "RESEND_API_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Server-only vars (skip in edge/client)
  if (typeof window === "undefined") {
    for (const key of REQUIRED_SERVER_ENV_VARS) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Check your .env.local file.`,
    );
  }

  // Warn about optional vars
  if (typeof window === "undefined") {
    for (const key of OPTIONAL_ENV_VARS) {
      if (!process.env[key]) {
        console.warn(`[env] Optional variable ${key} is not set`);
      }
    }
  }
}

/**
 * Read a required environment variable or throw with a clear message.
 *
 * Phase 2-F: callers in lib/supabase/{server,admin,client}.ts use
 * this so env validation lives in one place rather than being
 * duplicated as inline `process.env.X!` non-null assertions or
 * bespoke if-checks.
 */
export function requireEnv(key: string, friendlyName?: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${key}` +
        (friendlyName ? ` (${friendlyName})` : "") +
        ". Check your .env.local file.",
    );
  }
  return value;
}
