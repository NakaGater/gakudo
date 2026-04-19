# Changelog — Design Iteration 1

## Created: 2026-04-19

### Files Created

1. **styles.css** — Shared stylesheet with all design system tokens (CSS custom properties), reset, and reusable component classes (buttons, inputs, cards, badges).

2. **index.html** — Public landing page. Information-first vertical scroll layout with:
   - Sticky top bar (logo + login link)
   - Facility introduction section with key info (address, hours, capacity, fees, contact)
   - Orientation schedule with date-based cards
   - Public notices list
   - Footer

3. **auth.html** — Login page. Minimal centered form with:
   - Logo + facility name
   - Email and password fields
   - Login button
   - Forgot password link
   - Back to top page link

4. **teacher.html** — Teacher dashboard with:
   - Desktop: fixed sidebar (w-64) with all 7 nav items + logout
   - Mobile: hamburger menu opening the same sidebar as a drawer with overlay
   - Attendance summary stats (total/present/absent/pending)
   - Quick action buttons (scan, create announcement, upload photos)
   - Recent announcements list with status badges
   - Today's attendance table (desktop) / card list (mobile)

5. **scan.html** — Fullscreen attendance scanner with:
   - Dark background, no navigation (back link only)
   - Camera preview area (centered, max-width 640px, 4:3 aspect ratio)
   - Viewfinder corner markers
   - Three result overlay states: check-in (green), check-out (blue), error (red)
   - Demo buttons at bottom to toggle between states (for design review)

6. **parent.html** — Parent dashboard (mobile-first, 375px base) with:
   - Sticky header with facility name and user name
   - Bottom tab navigation (4 tabs: home, attendance, messages, photos)
   - Home tab: today's attendance for 2 children, latest announcement preview
   - Attendance tab: per-child history with check-in/out times
   - Messages tab: chronological list with unread indicator (left border)
   - Photos tab: date-grouped thumbnail grid (3 columns)
   - JavaScript for tab switching

### Design Decisions

- Used emoji characters for icons as placeholder (Lucide icons would be used in production)
- Photo thumbnails are gray placeholder boxes
- Camera preview is a dark placeholder area
- All colors, spacing, typography, shadows, and radii strictly follow design-system.md tokens
- No inline styles used (except one margin-top on parent.html for section spacing within a repeated layout)
- Responsive breakpoints match the design system (768px for md, 1024px for lg)
