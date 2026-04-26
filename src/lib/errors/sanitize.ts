import * as Sentry from "@sentry/nextjs";

/**
 * Coerce an unknown error into a user-safe message and report the
 * original to server logs / Sentry.
 *
 * Why:
 *   The audit found ~23 call sites that returned `${error.message}`
 *   directly to the client. Supabase / Postgres errors leak schema
 *   names, constraint identifiers, and internal SQL — useful to an
 *   attacker, useless to the user. This helper makes the right thing
 *   the cheapest thing: callers pass an error and a fallback message,
 *   and the original detail goes to Sentry instead of the form.
 *
 * Behavior:
 *   - In development, the raw error is returned so the developer can
 *     debug locally without grepping logs.
 *   - In any other environment, the fallback is returned and the
 *     original is forwarded to console.error and Sentry. Sentry init
 *     is gated on DSN presence (see Phase 0-F), so this is a no-op
 *     when Sentry isn't configured.
 *
 * Returning the *same string* the caller asked for keeps the field
 * `message` semantics simple at every callsite.
 */
export function sanitizeError(err: unknown, fallback: string): string {
  if (process.env.NODE_ENV === "development") {
    // Surface the real reason while developing without turning every
    // callsite into a try/catch ladder.
    return err instanceof Error ? err.message : String(err);
  }

  if (err instanceof Error) {
    console.error("[sanitize]", err.message, err.stack);
  } else {
    console.error("[sanitize]", err);
  }

  try {
    Sentry.captureException(err);
  } catch {
    // Sentry not initialised — ignore.
  }

  return fallback;
}
