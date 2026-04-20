# Security report — gakudo

## Summary
- Critical: 0
- High: 0
- Medium: 1
- Low: 2

Scan date: 2026-04-20T15:25:37Z
Stack detected: Next.js 16, Supabase, TypeScript

## Critical findings

None.

## High findings

None.

## Medium findings

### M-1: Supabase local dev tokens in `.claude/settings.local.json`

| Field | Value |
|---|---|
| Severity | Medium |
| File | `.claude/settings.local.json` (line 41) |
| What | The standard Supabase local dev `service_role` JWT (`iss: supabase-demo`) appears in an allowed-command entry. |
| Why dangerous | The file is not git-tracked (untracked local config), so it poses no leak risk today. However, if a contributor swaps the demo token for a production key the pattern would persist. |
| Recommended fix | Remove the hardcoded JWT from the allowlist entry or use a `$SUPABASE_SERVICE_ROLE_KEY` env-var reference instead. |

## Low findings

### L-1: Test file contains dummy API key string

| Field | Value |
|---|---|
| Severity | Low (acceptable) |
| File | `src/lib/notifications/send.test.ts` (lines 60, 261) |
| What | `RESEND_API_KEY: "re_test_key"` used in test `vi.stubEnv` calls. |
| Why acceptable | Value is a clearly fake test stub, not a real credential. |

### L-2: Local dev JWT tokens in `.env.local`

| Field | Value |
|---|---|
| Severity | Low (acceptable) |
| File | `.env.local` (lines 2–3) |
| What | `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` contain JWTs with `iss: supabase-demo`. |
| Why acceptable | These are the well-known Supabase local development tokens (public). `.env.local` is git-ignored (`.env*` pattern in `.gitignore`) and has never been committed. |

## Auto-fixes applied

None — `npm audit` reported 0 vulnerabilities across 581 dependencies.

## Findings NOT auto-fixable

None.

## Posture check (from architecture.md)

| Check | Status | Evidence |
|---|---|---|
| Auth middleware on all private routes | ✅ PASS | `src/middleware.ts` calls `updateSession()` on every non-static request. `src/app/(dashboard)/layout.tsx` calls `getUser()` which redirects to `/login` if unauthenticated. All 4 API routes (`auth/invite`, `push/subscribe`, `billing/calculate`, `billing/export`) independently verify `supabase.auth.getUser()` and return 401 on failure. |
| RLS on all tables | ✅ PASS | All 14 tables defined in `00001_initial_schema.sql` have `ENABLE ROW LEVEL SECURITY` in `00002_rls_policies.sql`: profiles, children, child_parents, attendances, announcements, announcement_reads, photos, documents, billing_rules, monthly_bills, site_pages, site_news, notification_preferences, push_subscriptions. |
| Secrets in env vars only, not in repo | ✅ PASS | `.gitignore` contains `.env*` (except `.env.example`). `.env.local` is untracked. `.env.example` contains only empty placeholder keys. No real secrets found in source. The JWTs in `.claude/settings.local.json` are standard Supabase local dev tokens (`supabase-demo`). |
| No `dangerouslySetInnerHTML` | ✅ PASS | Zero occurrences found in `src/`. |
| No SQL injection vectors | ✅ PASS | All database access uses the Supabase JS client query builder (`.from().select()`, `.insert()`, `.update()`, etc.). No raw SQL, `.raw()`, `.sql()`, or `execute()` calls found in application code. |

## Notes for shipping

- **npm audit: clean** — 0 vulnerabilities in 581 packages (69 prod, 477 dev).
- **Auth posture is solid**: middleware refreshes sessions on all routes; dashboard layout has a server-side auth gate; all API routes independently check authentication and authorization.
- **RLS coverage is complete**: every table has RLS enabled with role-appropriate policies using helper functions (`is_admin()`, `is_staff()`).
- **No XSS surface**: no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval()` usage in application code.
- The only medium finding (M-1) is a local-only config file with a public dev token — no action required before shipping.
