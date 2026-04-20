# Changelog — iteration 1

## Summary
First pass of all 5 screens, faithfully expressing the gakudo design system mood:
温かい、信頼、整然、やさしい、実用的.

## Screens produced
1. **index.html** — Public HP landing with asymmetric hero layout (NOT centered hero + 3 cards)
2. **auth.html** — Login page, minimal centered card (appropriate for auth)
3. **app.html** — Teacher attendance dashboard with stats grid + children table
4. **attendance.html** — QR scanner page with scanner area + manual fallback table
5. **announcements.html** — Announcement list with unread dots, pagination

## Design system adherence
- Colors: All from design tokens (teal accent, stone neutrals, green enter, red exit)
- Font: Noto Sans JP only (no Inter)
- Spacing: 4px base scale throughout
- Radius: sm/md/lg only (no excessive rounding)
- Shadows: sm/md only (minimal, quiet)
- Anti-slop: No purple gradients, no Inter, no centered hero + 3 cards, no glassmorphism

## Key decisions
- Public HP hero uses asymmetric 2-column grid (text left, image right)
- Feature section uses 2x2 grid with icon+text items (not 3 centered cards)
- App shell: desktop sidebar (240px fixed) + mobile bottom tabs
- Attendance result uses full-width colored cards (green=enter, red=exit)
- Scanner area has dark background with teal border overlay
- Announcement cards use left-aligned unread dot indicator
- Table on mobile converts to stacked cards via CSS

## Known limitations
- Hero image is an emoji placeholder (🏫) — real photo needed
- Map area is placeholder text — Google Maps embed needed
- No JavaScript interactions (tabs, filters are visual only)
- Icons are emoji — should be Lucide icons in production
- No loading/error states shown yet
- Mobile hamburger menu for public site nav not implemented
