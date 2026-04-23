# Implementation Plan — gakudo

Total tasks: 37
Estimated time (autonomous): ~150 min (37 tasks × ~4 min)

## Dependency graph

```
Task 1
Task 1 -> Task 2
Task 2 -> Task 3
Task 1 -> Task 4
Task 4 -> Task 5
Task 5 -> Task 6
Task 4, Task 6 -> Task 7
Task 7, Task 3 -> Task 8
Task 8 -> Task 9
Task 8 -> Task 10
Task 8 -> Task 11
Task 8, Task 3 -> Task 12
Task 7, Task 5 -> Task 13
Task 13 -> Task 14
Task 13 -> Task 15
Task 15 -> Task 16
Task 13, Task 7 -> Task 17
Task 17 -> Task 18
Task 17 -> Task 19
Task 17 -> Task 20
Task 17 -> Task 21
Task 7, Task 5 -> Task 22
Task 22 -> Task 23
Task 23 -> Task 24
Task 24 -> Task 25
Task 7 -> Task 26
Task 7, Task 5 -> Task 27
Task 27 -> Task 28
Task 5, Task 7 -> Task 29
Task 29, Task 17 -> Task 30
Task 30 -> Task 31
Task 31 -> Task 32
Task 32 -> Task 33
Task 1 -> Task 34
Task 34, Task 5 -> Task 35
Task 35 -> Task 36
Task 35 -> Task 37
```

---

## Phase 0: Foundation

### Task 1: Scaffold Next.js project with TypeScript and dependencies

**Files**
- `package.json` (create)
- `tsconfig.json` (create)
- `next.config.ts` (create)
- `src/app/layout.tsx` (create)
- `src/app/page.tsx` (create)
- `.env.example` (create)
- `.gitignore` (modify)

**Behavior**
`next dev` starts without errors. The root page renders a placeholder. TypeScript strict mode is enabled. All production dependencies are installed: `@supabase/supabase-js`, `@supabase/ssr`, `react-qr-code`, `html5-qrcode`, `browser-image-compression`, `lucide-react`, `web-push`, `resend`.

**Depends on**
- None

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 2: Configure Tailwind with design system tokens

**Files**
- `tailwind.config.ts` (create)
- `src/app/globals.css` (create)
- `postcss.config.mjs` (create)

**Behavior**
Tailwind is configured with custom colors (`accent`, `enter`, `exit`, `bg`, `fg`, `fg-muted`, `success`, `warning`, `danger`, `border`), font family (`Noto Sans JP`), border-radius (`sm`, `md`, `lg`), and spacing scale from `docs/design-system.md`. CSS variables are defined in `:root`.

**Depends on**
- Task 1

**Verify**
- `npm run build`

---

### Task 3: Create shared UI components (Button, Input, Card)

**Files**
- `src/components/ui/button.tsx` (create)
- `src/components/ui/button.test.tsx` (create)
- `src/components/ui/input.tsx` (create)
- `src/components/ui/card.tsx` (create)
- `src/components/ui/badge.tsx` (create)

**Behavior**
`Button` renders primary/secondary/ghost/destructive/enter/exit variants with proper Tailwind classes. `Input` renders with label, error state, and focus ring. `Card` renders with elevation shadow. `Badge` renders enter/exit status badges. All components accept `className` prop for composition.

**Depends on**
- Task 2

**Verify**
- `npm test -- src/components/ui/button.test.tsx`
- `npx tsc --noEmit`

---

### Task 4: Set up Supabase client utilities

**Files**
- `src/lib/supabase/client.ts` (create)
- `src/lib/supabase/server.ts` (create)
- `src/lib/supabase/middleware.ts` (create)
- `src/lib/supabase/types.ts` (create)

**Behavior**
`createBrowserClient()` returns a Supabase client for Client Components. `createServerClient()` returns a Supabase client for Server Components/Actions using cookies. `updateSession()` middleware helper refreshes auth session. `Database` type is exported (initially manual, later generated).

**Depends on**
- Task 1

**Verify**
- `npx tsc --noEmit`

---

### Task 5: Create database schema migration

**Files**
- `supabase/migrations/00001_initial_schema.sql` (create)
- `supabase/seed.sql` (create)
- `supabase/config.toml` (create)

**Behavior**
Migration creates all 14 tables from `docs/architecture.md` §3: `profiles`, `children`, `child_parents`, `attendances`, `announcements`, `announcement_reads`, `photos`, `documents`, `billing_rules`, `monthly_bills`, `site_pages`, `site_news`, `notification_preferences`, `push_subscriptions`. Indexes on `attendances(child_id, recorded_at)`. Seed file creates 1 admin user for dev.

**Depends on**
- Task 4

**Verify**
- `supabase db reset` (ローカル)
- `supabase db lint`

---

### Task 6: Add Row Level Security policies

**Files**
- `supabase/migrations/00002_rls_policies.sql` (create)

**Behavior**
RLS is enabled on all tables. Policies implement: parent sees own children (via `child_parents`), teacher/admin see all children, attendance read restricted by role, photos respect `visibility` column, `monthly_bills` restricted to own children for parents. Admin role bypasses via `profiles.role = 'admin'` check.

**Depends on**
- Task 5

**Verify**
- `supabase db reset`
- `supabase db lint`

---

### Task 7: Add auth middleware and protected layout

**Files**
- `src/middleware.ts` (create)
- `src/app/(dashboard)/layout.tsx` (create)
- `src/lib/auth/get-user.ts` (create)

**Behavior**
Middleware intercepts all `/(dashboard)/*` routes, refreshes Supabase session, redirects to `/login` if unauthenticated. `getUser()` helper returns the current user profile (id, role, name) from server context. Dashboard layout wraps children with nav shell.

**Depends on**
- Task 4, Task 6

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

## M1: Authentication

### Task 8: Build login page with Supabase Auth

**Files**
- `src/app/(auth)/login/page.tsx` (create)
- `src/app/(auth)/login/actions.ts` (create)
- `src/app/(auth)/login/login.test.tsx` (create)
- `src/app/(auth)/layout.tsx` (create)

**Behavior**
Login page renders email + password form. Server Action calls `supabase.auth.signInWithPassword()`. On success, redirects to `/dashboard`. On failure, shows error message. Auth layout is a centered card on the `--color-bg` background.

**Depends on**
- Task 7, Task 3

**Verify**
- `npm test -- src/app/(auth)/login/login.test.tsx`
- `npm run build`

---

### Task 9: Implement password reset flow

**Files**
- `src/app/(auth)/forgot-password/page.tsx` (create)
- `src/app/(auth)/forgot-password/actions.ts` (create)
- `src/app/(auth)/reset-password/page.tsx` (create)
- `src/app/(auth)/reset-password/actions.ts` (create)

**Behavior**
Forgot-password page accepts email, calls `supabase.auth.resetPasswordForEmail()` with redirect URL. Reset-password page accepts new password, calls `supabase.auth.updateUser()`. Both show success/error feedback.

**Depends on**
- Task 8

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 10: Build admin user invite flow

**Files**
- `src/app/api/auth/invite/route.ts` (create)
- `src/app/(dashboard)/admin/users/page.tsx` (create)
- `src/app/(dashboard)/admin/users/invite-form.tsx` (create)
- `src/app/(dashboard)/admin/users/actions.ts` (create)

**Behavior**
Admin page lists all users with roles. Invite form sends email + role. API route uses `supabase.auth.admin.inviteUserByEmail()` with Resend as SMTP. New user receives invite email with magic link. Non-admin users cannot access this page (middleware redirect).

**Depends on**
- Task 8

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 11: Create user profile page

**Files**
- `src/app/(dashboard)/profile/page.tsx` (create)
- `src/app/(dashboard)/profile/actions.ts` (create)
- `src/app/(dashboard)/profile/profile.test.tsx` (create)

**Behavior**
Profile page shows current user's name and email. User can update their display name. Server Action updates `profiles` table. Shows success toast on save.

**Depends on**
- Task 8

**Verify**
- `npm test -- src/app/(dashboard)/profile/profile.test.tsx`
- `npm run build`

---

### Task 12: Build role-based navigation component

**Files**
- `src/components/nav/sidebar.tsx` (create)
- `src/components/nav/mobile-tabs.tsx` (create)
- `src/components/nav/nav-items.ts` (create)
- `src/components/nav/nav.test.tsx` (create)

**Behavior**
`Sidebar` renders on desktop (>= md) with nav items filtered by role. `MobileTabs` renders on mobile (< md) as bottom tab bar. Nav items: 保護者 → [ホーム, 入退場, 連絡, 写真, 請求], 先生 → [ホーム, 入退場, 連絡, 写真, 請求, 児童], 管理者 → all + [ユーザー, HP管理]. Active state uses `--color-accent-light`.

**Depends on**
- Task 8, Task 3

**Verify**
- `npm test -- src/components/nav/nav.test.tsx`
- `npm run build`

---

## M2: Attendance (KAZASU replacement)

### Task 13: Build children CRUD for admin

**Files**
- `src/app/(dashboard)/children/page.tsx` (create)
- `src/app/(dashboard)/children/new/page.tsx` (create)
- `src/app/(dashboard)/children/[id]/page.tsx` (create)
- `src/app/(dashboard)/children/actions.ts` (create)

**Behavior**
Admin can list all children (name, grade, QR status). Create form accepts name + grade, auto-generates unique `qr_code` string (`GK-XXXX`). Detail page shows child info + linked parents. Only admin/teacher can access.

**Depends on**
- Task 7, Task 5

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 14: Implement child-parent linking

**Files**
- `src/app/(dashboard)/children/[id]/link-parent.tsx` (create)
- `src/app/(dashboard)/children/actions.ts` (modify)

**Behavior**
Admin can search existing parents by name/email and link to a child via `child_parents` table. Can also unlink. Child detail page shows linked parents list. A parent can be linked to multiple children.

**Depends on**
- Task 13

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 15: Build QR code generation and display

**Files**
- `src/components/qr/qr-display.tsx` (create)
- `src/components/qr/qr-print.tsx` (create)
- `src/components/qr/qr-display.test.tsx` (create)
- `src/app/(dashboard)/children/[id]/qr/page.tsx` (create)

**Behavior**
`QRDisplay` renders child's QR code as SVG using `react-qr-code`. `QRPrint` component generates a printable card layout (child name + QR + grade). QR page allows admin to view, regenerate (invalidate old), and print QR code. QR value encodes `qr_code` field from children table.

**Depends on**
- Task 13

**Verify**
- `npm test -- src/components/qr/qr-display.test.tsx`
- `npm run build`

---

### Task 16: Build QR scanner component

**Files**
- `src/components/qr/qr-scanner.tsx` (create)
- `src/components/qr/qr-scanner.test.tsx` (create)

**Behavior**
`QRScanner` wraps `html5-qrcode` library. On mount, requests camera permission and starts scanning. On successful decode, calls `onScan(decodedText)` callback. Shows camera preview with scanning overlay. Handles camera permission denied error. Cleanup on unmount.

**Depends on**
- Task 15

**Verify**
- `npm test -- src/components/qr/qr-scanner.test.tsx`
- `npx tsc --noEmit`

---

### Task 17: Implement attendance recording with auto enter/exit

**Files**
- `src/app/(dashboard)/attendance/page.tsx` (create)
- `src/app/(dashboard)/attendance/actions.ts` (create)
- `src/app/(dashboard)/attendance/attendance.test.ts` (create)

**Behavior**
Attendance page embeds `QRScanner`. On scan, Server Action `recordAttendance(qrCode)` looks up child, checks today's latest record: if none or last is `exit` → record `enter`; if last is `enter` → record `exit`. Returns child name + action type. Page displays full-screen result (green=enter, red=exit) for 3 seconds, then resets to scanner. Sound feedback on success/error.

**Depends on**
- Task 13, Task 7

**Verify**
- `npm test -- src/app/(dashboard)/attendance/attendance.test.ts`
- `npm run build`

---

### Task 18: Add manual attendance fallback

**Files**
- `src/app/(dashboard)/attendance/manual/page.tsx` (create)
- `src/app/(dashboard)/attendance/actions.ts` (modify)

**Behavior**
Manual page lists all children with today's status (未入室/入室中/退室済). Teacher can tap a child to toggle enter/exit manually. Records with `method: 'manual'`. Accessible from attendance page via "手動入力" button. Same notification trigger as QR scan.

**Depends on**
- Task 17

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 19: Add attendance notification trigger

**Files**
- `src/lib/notifications/send.ts` (create)
- `src/lib/notifications/send.test.ts` (create)
- `src/app/(dashboard)/attendance/actions.ts` (modify)

**Behavior**
After attendance is recorded, `sendAttendanceNotification(childId, type)` fetches linked parents' notification preferences. For `push` preference, sends Web Push. For `email` preference, sends via Resend. Message: "{child_name}が{入室/退室}しました ({time})". Non-blocking (errors logged, not thrown).

**Depends on**
- Task 17

**Verify**
- `npm test -- src/lib/notifications/send.test.ts`

---

### Task 20: Build attendance history page (parent view)

**Files**
- `src/app/(dashboard)/attendance/history/page.tsx` (create)
- `src/app/(dashboard)/attendance/history/history.test.tsx` (create)

**Behavior**
Parent sees attendance history for their children only (RLS enforced). Filterable by date range and child. Shows daily timeline: enter time, exit time, duration. Teacher/admin sees all children. Default view: current week.

**Depends on**
- Task 17

**Verify**
- `npm test -- src/app/(dashboard)/attendance/history/history.test.tsx`
- `npm run build`

---

### Task 21: Build attendance dashboard (teacher view)

**Files**
- `src/app/(dashboard)/attendance/dashboard/page.tsx` (create)

**Behavior**
Teacher/admin sees today's attendance summary: total present, total expected, list of children with status (未入室/入室中/退室済). Real-time updates not required for v1 (manual refresh). Color-coded badges per child status.

**Depends on**
- Task 17

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

## M3: Communication (LINE replacement)

### Task 22: Build announcements list page

**Files**
- `src/app/(dashboard)/announcements/page.tsx` (create)
- `src/app/(dashboard)/announcements/announcement-card.tsx` (create)

**Behavior**
Lists announcements in reverse chronological order. Each card shows title, body preview (80 chars), posted date, author name. For parents: shows unread badge if not yet read. Paginated (10 per page).

**Depends on**
- Task 7, Task 5

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 23: Build announcement create form

**Files**
- `src/app/(dashboard)/announcements/new/page.tsx` (create)
- `src/app/(dashboard)/announcements/actions.ts` (create)

**Behavior**
Teacher/admin can create announcement with title + body (textarea). Server Action inserts into `announcements` table. On success, redirects to announcements list. Only teacher/admin can access create page.

**Depends on**
- Task 22

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 24: Implement announcement read tracking

**Files**
- `src/app/(dashboard)/announcements/[id]/page.tsx` (create)
- `src/app/(dashboard)/announcements/actions.ts` (modify)

**Behavior**
Announcement detail page shows full content. On page load (for parents), Server Action marks as read via `announcement_reads` insert. Teacher sees read/unread count per announcement. Read status is per-user, not per-announcement.

**Depends on**
- Task 23

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 25: Implement notification dispatch for announcements

**Files**
- `src/lib/notifications/send.ts` (modify)
- `src/app/(dashboard)/announcements/actions.ts` (modify)

**Behavior**
When announcement is created, `sendAnnouncementNotification(announcementId)` sends push/email to all parents based on their notification preferences. Email subject: "【gakudo】{title}". Push body: first 100 chars of announcement body.

**Depends on**
- Task 24

**Verify**
- `npx tsc --noEmit`

---

### Task 26: Build push notification subscription API

**Files**
- `src/app/api/push/subscribe/route.ts` (create)
- `src/app/api/push/subscribe/route.test.ts` (create)
- `src/components/push/push-prompt.tsx` (create)

**Behavior**
API route accepts POST with push subscription object, stores in `push_subscriptions`. `PushPrompt` component shown on first login asks user to enable push notifications. Handles browser permission flow. Stores VAPID public key in env.

**Depends on**
- Task 7

**Verify**
- `npm test -- src/app/api/push/subscribe/route.test.ts`
- `npx tsc --noEmit`

---

### Task 27: Build document upload and list

**Files**
- `src/app/(dashboard)/documents/page.tsx` (create)
- `src/app/(dashboard)/documents/actions.ts` (create)
- `src/app/(dashboard)/documents/upload-form.tsx` (create)

**Behavior**
Teacher/admin can upload PDF/image files with title and category. Files stored in Supabase Storage `documents` bucket. List page shows documents grouped by category, sorted by date. Parents can view/download. Max file size: 10MB.

**Depends on**
- Task 7, Task 5

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 28: Build document viewer

**Files**
- `src/app/(dashboard)/documents/[id]/page.tsx` (create)

**Behavior**
Document detail page shows file preview (images inline, PDFs in iframe). Download button for all file types. Shows upload date, category, uploader name.

**Depends on**
- Task 27

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

## M3.5: Photo Sharing

### Task 29: Build photo upload with compression

**Files**
- `src/app/(dashboard)/photos/page.tsx` (create)
- `src/app/(dashboard)/photos/actions.ts` (create)
- `src/app/(dashboard)/photos/upload-form.tsx` (create)
- `src/lib/photos/compress.ts` (create)
- `src/lib/photos/compress.test.ts` (create)

**Behavior**
Teacher uploads photos with optional event name and caption. Client-side compression via `browser-image-compression` (max 1920px, 500KB). Compressed file uploaded to Supabase Storage `photos` bucket. Default visibility: `private`. Admin can toggle to `public` via checkbox.

**Depends on**
- Task 5, Task 7

**Verify**
- `npm test -- src/lib/photos/compress.test.ts`
- `npm run build`

---

## M4: Billing

### Task 30: Build billing rules admin page

**Files**
- `src/app/(dashboard)/billing/rules/page.tsx` (create)
- `src/app/(dashboard)/billing/actions.ts` (create)

**Behavior**
Admin can set extended care billing rules: regular end time, rate per unit (yen), unit duration (minutes), effective date. Shows current active rule and history. New rule creation doesn't delete old ones (audit trail).

**Depends on**
- Task 29 (parallel track — actual dep is Task 5 + Task 7)

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 31: Implement monthly bill calculation

**Files**
- `src/app/api/billing/calculate/route.ts` (create)
- `src/lib/billing/calculate.ts` (create)
- `src/lib/billing/calculate.test.ts` (create)

**Behavior**
`calculateMonthlyBill(childId, yearMonth)` sums extended minutes from attendance records. Extended = time after `regular_end_time` from active billing rule. Total amount = ceil(extended_minutes / unit_minutes) × rate_per_unit. Batch endpoint calculates for all children for given month. Creates/updates `monthly_bills` records with status `draft`.

**Depends on**
- Task 30, Task 17

**Verify**
- `npm test -- src/lib/billing/calculate.test.ts`

---

### Task 32: Build monthly bill list (parent/admin view)

**Files**
- `src/app/(dashboard)/billing/page.tsx` (create)
- `src/app/(dashboard)/billing/[yearMonth]/page.tsx` (create)

**Behavior**
Parent sees their children's monthly bills (RLS). Admin/teacher sees all. List page shows year-month, child name, total amount, status (draft/confirmed). Detail page shows daily breakdown: date, exit time, extended minutes, unit count, amount.

**Depends on**
- Task 31

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 33: Implement bill confirmation and CSV export

**Files**
- `src/app/(dashboard)/billing/actions.ts` (modify)
- `src/app/api/billing/export/route.ts` (create)
- `src/lib/billing/csv.ts` (create)
- `src/lib/billing/csv.test.ts` (create)

**Behavior**
Teacher/admin can confirm a month's bills (status → `confirmed`, sets `confirmed_at` and `confirmed_by`). CSV export endpoint generates file with columns: child_name, year_month, total_extended_minutes, total_amount, status. Filename: `gakudo-billing-{yearMonth}.csv`. UTF-8 BOM for Excel compatibility.

**Depends on**
- Task 32

**Verify**
- `npm test -- src/lib/billing/csv.test.ts`
- `npm run build`

---

## M5: External HP

### Task 34: Create public layout with SSG

**Files**
- `src/app/(public)/layout.tsx` (create)
- `src/app/(public)/page.tsx` (create)
- `src/app/(public)/components/header.tsx` (create)
- `src/app/(public)/components/footer.tsx` (create)

**Behavior**
Public pages use SSG (no auth required). Layout has header (facility name + nav) and footer (address, contact). Top page shows facility overview from `site_pages` where `slug = 'home'`. Responsive design following design system. SEO meta tags.

**Depends on**
- Task 1

**Verify**
- `npm run build`
- Check that public pages are statically generated in build output

---

### Task 35: Build site page CMS for admin

**Files**
- `src/app/(dashboard)/admin/site/pages/page.tsx` (create)
- `src/app/(dashboard)/admin/site/pages/[slug]/edit/page.tsx` (create)
- `src/app/(dashboard)/admin/site/actions.ts` (create)

**Behavior**
Admin can list and edit site pages (title + content as markdown/rich text). Content saved to `site_pages` table. Edit page has textarea with preview. Changes trigger ISR (Incremental Static Regeneration) via `revalidatePath`. Pre-defined slugs: `home`, `about`, `access`.

**Depends on**
- Task 34, Task 5

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 36: Build site news list and creation

**Files**
- `src/app/(public)/news/page.tsx` (create)
- `src/app/(public)/news/[id]/page.tsx` (create)
- `src/app/(dashboard)/admin/site/news/page.tsx` (create)
- `src/app/(dashboard)/admin/site/news/new/page.tsx` (create)
- `src/app/(dashboard)/admin/site/news/actions.ts` (create)

**Behavior**
Public news list page shows `site_news` entries (SSG with ISR). Detail page shows full content. Admin can create/edit news entries from dashboard. News creation triggers `revalidatePath('/news')`.

**Depends on**
- Task 35

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

### Task 37: Build public photo gallery

**Files**
- `src/app/(public)/gallery/page.tsx` (create)

**Behavior**
Public gallery page shows photos where `visibility = 'public'`. Grid layout with lightbox on click. Lazy-loaded images with Next.js `Image` component. Grouped by event name. No auth required — RLS allows public visibility photos to be read by anyone.

**Depends on**
- Task 35

**Verify**
- `npx tsc --noEmit`
- `npm run build`

---

## Summary by milestone

| Milestone | Tasks | Description |
|-----------|-------|-------------|
| Phase 0: Foundation | 1-7 | プロジェクト初期化、DB、Auth基盤 |
| M1: Authentication | 8-12 | ログイン、招待、プロフィール、ナビ |
| M2: Attendance | 13-21 | 児童管理、QR、入退場、通知、履歴 |
| M3: Communication | 22-28 | 連絡、既読、通知、資料 |
| M3.5: Photos | 29 | 写真アップロード・圧縮 |
| M4: Billing | 30-33 | 料金ルール、計算、請求、CSV |
| M5: External HP | 34-37 | 公開HP、CMS、ニュース、ギャラリー |
