# Security Report

**Date**: 2026-04-19
**Branch**: `claude/setup-fastest-mvp-plugin-LLVVa`
**Commit**: `8440b88`

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0     |
| HIGH     | 1     |
| MEDIUM   | 3     |
| LOW      | 0     |

**BLOCKING**: no

---

## 1. Secret Scan

**Result: PASS**

- No hardcoded API keys, tokens, passwords, or high-entropy strings found in `.ts`, `.tsx`, `.sql`, or `.toml` files.
- `supabase/config.toml` references secrets via `env()` wrapper (safe pattern).
- `.env.example` contains only placeholder values (`your-supabase-url`, etc.).
- No JWT tokens, GitHub PATs, OpenAI keys, or Slack tokens found in source.

---

## 2. Dependency Audit

**Result: PASS**

```
npm audit: 0 vulnerabilities (598 total dependencies)
  info: 0 | low: 0 | moderate: 0 | high: 0 | critical: 0
```

No known CVEs in the dependency tree.

---

## 3. Auth Posture Check

### 3a. Middleware (`src/middleware.ts`) -- PASS

- `/teacher/*` routes: Requires authenticated user with `role === 'teacher'`; redirects unauthenticated users to `/login` and non-teachers to `/parent`.
- `/parent/*` routes: Requires authenticated user with `role === 'parent'`; redirects unauthenticated users to `/login` and non-parents to `/teacher`.
- Public routes: No auth required (correct).
- Session refresh via `supabase.auth.getUser()` on every request (correct).

### 3b. Server Actions -- FINDINGS

#### HIGH-001: Missing auth checks in `teacher/parents/actions.ts`

**Severity**: HIGH
**File**: `src/app/(protected)/teacher/parents/actions.ts`

The functions `getParents()`, `getStudents()`, and `createParent()` do not include a `requireTeacher()` guard. While the middleware protects the page route, server actions can be invoked directly via POST request, bypassing middleware. Any authenticated user (including parents) could:

- List all parent profiles and their linked students
- Create new parent accounts (using the admin client with service role key)

**Recommendation**: Add a `requireTeacher()` check at the top of all three exported functions, consistent with the pattern used in `students/actions.ts`, `announcements/actions.ts`, `attendance/actions.ts`, and `photos/actions.ts`.

#### MEDIUM-001: Missing auth check in `teacher/notices/actions.ts` -- `updatePublicNotice`

**Severity**: MEDIUM
**File**: `src/app/(protected)/teacher/notices/actions.ts`

`updatePublicNotice()` does not verify the caller is authenticated or has the teacher role. It relies only on the Supabase client (which uses the user's session), so RLS may provide some protection, but the action itself has no explicit auth guard.

`getPublicNotices()` also lacks an auth check but this appears intentional since notices are public.

**Recommendation**: Add auth verification to `updatePublicNotice()`. Consider adding a `requireTeacher()` guard.

#### MEDIUM-002: Parent action checks authentication but not role

**Severity**: MEDIUM
**File**: `src/app/(protected)/parent/attendance/actions.ts`

`getMyChildrenAttendance()` verifies the user is authenticated (`if (!user) throw`) but does not verify the user has the `parent` role. A teacher could invoke this action. The impact is low since RLS on `parent_students` likely scopes results, but defense-in-depth calls for a role check.

**Recommendation**: Add a `requireParent()` guard that checks `profile.role === 'parent'`.

---

## 4. Environment & Secrets Handling

**Result: PASS**

- `.gitignore` includes `.env*` with an exception only for `.env.example` (correct).
- Only `.env.example` is tracked by git; it contains placeholder values only.
- `SUPABASE_SERVICE_ROLE_KEY` is referenced in exactly one file: `src/lib/supabase/admin.ts` (server-side only, correct).
- `createAdminClient()` is imported in exactly one action file: `teacher/parents/actions.ts` (appropriate use for creating auth users).

---

## 5. Additional Findings

#### MEDIUM-003: No security headers configured

**Severity**: MEDIUM
**File**: `next.config.ts`

No security headers are configured in `next.config.ts` or middleware. Missing headers:

- `X-Frame-Options` / `Content-Security-Policy` frame-ancestors (clickjacking protection)
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`

**Recommendation**: Add a `headers()` function to `next.config.ts` to set standard security headers.

---

## Remediation Priority

| ID | Severity | Effort | Description |
|----|----------|--------|-------------|
| HIGH-001 | HIGH | Low | Add `requireTeacher()` to parents/actions.ts |
| MEDIUM-001 | MEDIUM | Low | Add auth check to `updatePublicNotice()` |
| MEDIUM-002 | MEDIUM | Low | Add `requireParent()` to parent attendance action |
| MEDIUM-003 | MEDIUM | Medium | Add security headers to next.config.ts |
