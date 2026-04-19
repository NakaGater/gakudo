# Changelog — iteration 3 (final polish)

## Changes from iter-2

### 1. ARIA tab pattern on parent.html bottom nav
- Added `role="tablist"` to `.bottom-nav` container
- Added `role="tab"`, `id`, `aria-selected`, and `aria-controls` to each bottom nav button
- Changed tab panels from `aria-label` to `aria-labelledby` linking to their corresponding tab button IDs
- Updated JS `switchTab()` to toggle `aria-selected` (true/false) instead of `aria-current`
- **Files changed**: parent.html

### 2. Harmonized input focus styles (double focus ring fix)
- Removed `outline: none` from `.input-field:focus` (was suppressing the global outline prematurely)
- Added `.input-field:focus-visible { outline: none; }` to explicitly override the global `focus-visible` outline for inputs
- Inputs now consistently use the box-shadow ring approach on `:focus`, with no double ring on keyboard navigation
- **Files changed**: styles.css

### 3. Teacher quick actions mobile layout
- Added `@media (max-width: 767px)` rule making `.quick-actions .btn-primary` full-width (`width: 100%`)
- Primary action button now visually dominates on mobile, with secondary actions flowing underneath at their natural width
- **Files changed**: teacher.html

### 4. General polish
- **Date realism**: Changed parent.html "today" date from 4月19日（日）(Sunday) to 4月17日（金）(Friday) -- a realistic weekday for after-school care. Updated all attendance history dates accordingly (4月16日（木）, 4月15日（水）)
- **Photo placeholder reduction**: Reduced from 14 placeholders (5+3+6) to 10 (4+3+3) across 3 date groups, reducing visual monotony while still demonstrating the grid layout
- **Photo date alignment**: Updated photo date labels (4月18日 -> 4月16日, 4月15日 -> 4月14日) to be consistent with the new date context
- **Files changed**: parent.html

## Design system token compliance
All changes use only tokens from design-system.md. No new colors, shadows, fonts, or spacing values introduced.
