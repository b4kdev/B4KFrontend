# CLAUDE.md — B4KFrontend

> Auto-loaded by Claude Code on every session in this repo. Do not delete or rename.
> This repo has no rules of its own — the rules that govern its code live in the sibling
> `B4K_v1.0` repo and are imported below, so there is one source of truth, not two copies to
> keep in sync. Product context, sprint state, locked decisions, FRD screen inventory, and DoD
> gates also live there (`B4K_v1.0/CLAUDE.md`) — read that file directly when you need them;
> it is not duplicated here on purpose.

**Rules files (always loaded — imported from `B4K_v1.0`, the canonical copy):**
@../B4K_v1.0/.claude/rules/schema.md
@../B4K_v1.0/.claude/rules/tokens.md
@../B4K_v1.0/.claude/rules/antipatterns.md
@../B4K_v1.0/.claude/rules/security.md

**Process reference (read when doing that work — commit/PR/wrap-up, not eager-loaded):**
`../B4K_v1.0/.claude/rules/workflow.md`

**First time this loads:** Claude Code will show an approval prompt for these external imports
(they resolve outside this repo's boundary) — approve once, it won't ask again for this repo.

---

## Working in this repo

- All screen/feature building happens here — never in `B4KStudio/` (that's the other repo).
- Worktree mandatory for any edit here (DEC-44, `B4K_v1.0`) — never edit the primary
  `B4KFrontend` checkout on `main`/`devtest` directly.
- Middle branch is `devtest` (not `verify` — that name is `B4K_v1.0`-specific). Full flow:
  `feat/<slug>` branch → PR → `devtest` → PR (batched) → `main`.
- Full product/process context, FRD screen IDs, locked decisions, DoD gates, open blockers:
  `B4K_v1.0/CLAUDE.md`.
