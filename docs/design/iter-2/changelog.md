# Changelog — iteration 2

## Feedback addressed
1. **Public site mobile nav (critical)** → Added hamburger menu with JS toggle. Mobile users can now access all sections. (feedback: "Public site mobile has NO navigation")
2. **Emoji → SVG icons** → Replaced all emoji with inline SVG icons (Lucide-style, stroke-width 1.75). Sidebar, mobile tabs, features, hero all use consistent SVGs. (feedback: "Emoji render inconsistently across OS")
3. **Empty states** → Added empty state component for announcements list and children table when filtered to "退室済" showing 0 results. (feedback: "No empty states shown for any list region")
4. **Filter tab active state** → Dashboard filter tabs now use same accent-light + accent-text pattern as announcements "すべて" tab. (feedback: "filter tabs have no clear active state")
5. **Unread announcement indicator** → Unread announcements now have left accent border + light teal background + bold title. Much more visible than 8px dot alone. (feedback: "unread dot is small and easily missed")

## Additional improvements
- Tightened public HP section spacing from --space-16 to --space-12
- Auth login button width now uses `.btn-block` CSS class instead of inline style
- Hero image area replaced with a warm illustration-style placeholder (SVG scene)
- Added `.btn-block` utility class
- Added form error state example below login form
- Reduced inline styles in app pages
