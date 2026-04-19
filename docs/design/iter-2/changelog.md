# Changelog — iteration 2

## Feedback addressed

### 1. CRITICAL: scan.html overlay visibility bug
- **Feedback**: `.scan-result-overlay` had `display: flex` which overrode the HTML `hidden` attribute, causing all 3 overlays to render simultaneously.
- **Fix**: Added `[hidden] { display: none !important; }` rule to `styles.css` (line 83). This ensures the `hidden` attribute is always respected regardless of any `display` value set by other CSS rules. The overlay CSS retains `display: flex` for when overlays are shown, but the `[hidden]` rule takes precedence when the attribute is present.

### 2. Empty states for teacher.html
- **Feedback**: No empty-state fallback for attendance table and announcements list.
- **Fix**: Added empty state components to both sections in `teacher.html`:
  - Announcements: `#announcementEmpty` with Megaphone icon and text "連絡事項はまだありません"
  - Attendance: `#attendanceEmpty` with Clock icon and text "本日の入退場記録はまだありません"
  - Both use the `.empty-state` component class added to `styles.css` with centered layout, 48px icon, and `--color-fg-muted` text per design system spec.
  - Empty states are `hidden` by default (toggled via JS/server when lists are empty).

### 3. Replace emoji icons with inline SVG Lucide icons
- **Feedback**: Emoji icons (📊👦📋📷📢🖼📝🚪☰🏠) varied across platforms and looked less polished than Lucide icons specified in the design system.
- **Fix**: Replaced ALL emoji icons with inline SVG Lucide icons (stroke-width: 1.5) across all files:
  - `styles.css`: Added `.icon`, `.icon-16`, `.icon-20`, `.icon-24`, `.icon-48` utility classes with proper SVG styling.
  - `teacher.html` sidebar: ClipboardCheck (dashboard), Users (students), Clock (attendance records), ScanLine (scan), Megaphone (announcements), Image (photos), Bell (public notices), LogOut (logout), Menu (hamburger), X (close sidebar).
  - `teacher.html` quick actions: ScanLine, Megaphone, Image icons in buttons.
  - `scan.html`: Camera (placeholder), Check/X (overlays), ArrowLeft (back link).
  - `parent.html` bottom nav: Home, Clock, MessageSquare, Image.
  - `parent.html` photos tab: Image icon placeholders replacing "写真" text.
  - `index.html` topbar: LogIn icon next to login link.

### 4. Focus states on all interactive elements
- **Feedback**: Need visible focus outlines on all interactive elements.
- **Fix**:
  - Extended the existing `focus-visible` rule in `styles.css` to also cover `[role="button"]:focus-visible`.
  - `teacher.html`: Hamburger button (`.hamburger-btn`) gets focus via the global `button:focus-visible` rule; also added `border-radius: var(--radius-sm)` and hover state for visual polish.
  - `scan.html`: Added `focus-visible` override with white outline for `.scan-back` and `.demo-btn` since they're on dark backgrounds.

### 5. Teacher dashboard mobile — redundant heading & sidebar improvements
- **Feedback**: "ダッシュボード" appeared as both mobile header title and page h1, causing redundancy.
- **Fix**:
  - Changed mobile header title from "ダッシュボード" to "ひまわり学童" (the app short name), eliminating redundancy while keeping useful context.
  - Added `display: none` for `.page-title` on screens below 1024px so the h1 only shows on desktop where the sidebar provides branding.
  - Added a close (X) button inside the mobile sidebar drawer for clearer dismissal.
  - Added `.attendance-card-info` wrapper div for better flex layout of mobile attendance cards.

### 6. Photo placeholders (bonus improvement)
- **Feedback**: Photo placeholders used plain "写真" text on gray background.
- **Fix**: Replaced text-only placeholders with Lucide Image icon centered in each thumbnail. Background changed to `--color-bg` with `--color-border` border for a cleaner placeholder appearance per design system spec (bg `--color-bg`, icon `--color-fg-muted`).
