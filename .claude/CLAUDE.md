# CLAUDE.md — B4KFrontend (Working Project)
> Clean architecture restart. You are in the active Next.js project directory.
> Root project rules: `../CLAUDE.md` (auto-loaded)
> Rules files: `@../.claude/rules/schema.md` · `@../.claude/rules/tokens.md` · `@../.claude/rules/antipatterns.md` · `@../.claude/rules/workflow.md`

## ⚡ RIGHT NOW

**UI must be finished this weekend. Testing starts Tuesday.**

- Check `B4K-FRD-v2.0.xlsx` for screen requirements before touching anything
- Every screen = all 6 DoD gates passed (root CLAUDE.md Section 11)
- Visual reference: open `docs/prototype/Home_RefFrame.html` in browser — target look
- Prototype: `docs/prototype/*.jsx` + `tokens.css` — port the pattern, not the code verbatim
- All building happens in this directory (`B4KFrontend/`) only

## Auto-loaded context for API routes

When writing or editing anything in `app/api/`:
@../.claude/rules/schema.md

When writing or editing any component or screen:
@../.claude/rules/tokens.md
@../.claude/rules/antipatterns.md

## Source of Truth Files (local paths)

| What | Path |
|---|---|
| Features / screens | `B4K-FRD-v2.0.xlsx` |
| Database schema | `B4K-Schema-v2.0.md` |
| UI / components | `B4K-DesignSystem-v2.0.html` |
| Color system | `B4K-ColorPalette-v2.0.html` |
| Typography | `B4K-FontSystem-v2.0.html` |
| Icons | `B4K-IconSystem-v2.0.html` |
| Visual prototype | `docs/prototype/Home_RefFrame.html` |

## Directory structure

- `app/[locale]/` — next-intl routing
- `components/` — shared components
- `app/api/` — all SWR hooks fetch here
- `messages/` — i18n JSON files per locale
- `lib/` — utilities (getDisplayName, etc.)
- `docs/prototype/` — visual prototype reference (read-only)

## Quick start for a new screen

1. `/clear` to start fresh context
2. Check `B4K-FRD-v2.0.xlsx` for the screen ID requirements
3. `/b4k-screen <ID>` to load FRD + DoD + Laws of UX
4. Build: Mobile.tsx + Desktop.tsx + index.tsx (if architecturally distinct)
5. Wire: SWR hook → `app/api/[route]`
6. i18n: all 7 languages in one pass
7. `/b4k-audit <ID>` mid-build check
8. `/owasp-security` if touching api/ or auth
9. `/b4k-review <ID>` — SCREEN_DONE blocked until zero [blocking] findings
