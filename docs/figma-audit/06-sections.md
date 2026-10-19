# Sections audit (B4K UI Components page 1:7) — FIXED in components/library/Sections.tsx and components/v2/V2QuickPlan.tsx

| Component | Element | Property | Figma | Code before | Status |
|---|---|---|---|---|---|
| Explore section row / Plan card row | Track | gap | space-3 12 | space-4 16 | fixed |
| Explore section row / Plan card row | Card (mobile) | width | 280 | max-sm:w-[78%] | fixed |
| Explore section row / Plan card row | Header arrows (desktop) | presence | Previous/Next Secondary 40 | not exposed | fixed as optional `arrowLabels` prop; not wired — needs copy (no Copy Deck row for rail Previous/Next) |
| Explore collections | Grid | gap | 12 | 16 | fixed |
| Explore collections | Chips row | wrap | single row, no wrap | flex-wrap | fixed (one scrollable row) |
| Explore packages | Grid | gap | 12 | 16 | fixed |
| Quick plan | Mobile sheet | border | 1px color/border | none | fixed |
| Quick plan | Mobile step 1 columns | gap | space-6 24 | 20 | fixed |
| Quick plan | Mobile step 2 category row → chips | gap | 24 | 16 | fixed |
| Quick plan | Mobile step 2 category row | bleed | inside body padding | bled to edges | fixed |
| Quick plan | Step 3 summary | radius | none | rounded-md 6 (not a token) | fixed |
| Quick plan | Mobile step 3 key | wrap | nowrap | could wrap | fixed |
| Quick plan | Step 2 selected label | format | "SELECTED · 3 OF 10" | "Selected interests · 3 / 10" | needs copy decision |
| Planning cue | Tile | gap | space-4 16 | 12 | fixed |
| Planning cue | Tile (desktop) | padding | px 16 / py 24 | 16 all | fixed |
| Planning cue | Start first tile | icon | plus | map | fixed |
| Planning cue | Description | text style | body/base | body/caption | fixed |
| Planning cue | Chevron | size/color | 24, fg | 16, fg-muted | fixed |
| Interests card | Card | padding/gap | 16 / 12 | 20 / 16 | fixed |
| Interests card | Title | text style | title/card | display/h3 | fixed |
| Interests card | Header | layout | title + Dismiss row (centered), text below | stacked column beside Dismiss | fixed |
| Interests card | Save | variant/size | Secondary lg 44, full width on phones | Primary md 40, self-start | fixed |
Templates page: empty by design (templates are in B4K UI Screens) — not comparable.
Section outer padding (py24, px32 desktop / pl16 mobile) is page-level → screen audit.
