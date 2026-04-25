// Next.js calls register() once at process startup for the matching runtime.
// Sentry is initialised only when a DSN is configured; the init files
// themselves no-op when env is unset.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
