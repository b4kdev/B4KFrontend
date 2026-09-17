# Design Spine Restyle — Handoff

For whoever continues this next (different Claude account). Everything below was checked directly this session — real tool calls, real computed CSS values, real grep counts — not carried forward from memory or assumption. Where something wasn't checked, it says so.

## What this is

Porting the Design Spine color/radius system (Figma "Token-Extract" file, fileKey `37octxSrI0LdBzX148HlbI`) into `B4KFrontend`'s actual styling. `B4KFrontend` was 100% on the old token system before this branch — this is the first real code-side migration work.

**Strategy: value-only swap.** Old CSS variable *names* and Tailwind class names stay exactly as they are — only the *values* change, in `app/globals.css`. Zero component files touched, zero renames. This keeps blast radius small: nothing can silently break from an unknown/missed consumer, since nothing was renamed.

**Explicit instruction from the product owner: do NOT merge yet.** Keep extending this branch until the full reskin is done (typography, full-page sweep, etc.) — he wants to review the *whole* thing together before deciding whether to merge, not approve it piecemeal. Don't merge PR #188 without him explicitly saying so.

## Where things live

- **Worktree:** `B4KFrontend-design-spine-restyle` (sibling directory to the primary `B4KFrontend/` checkout)
- **Branch:** `style/design-spine-restyle`, based on `origin/main` — deliberately NOT `devtest`, per the product owner's direct instruction mid-session. At branch-creation time `main` and `devtest` were the same commit (`bb2f391`), so this hasn't mattered yet — check for drift between them before this eventually merges.
- **PR:** [#188](https://github.com/b4kdev/B4KFrontend/pull/188), targets `devtest` (the repo's real middle branch per `workflow.md`'s PR Regulations). Open. Do not merge without explicit go-ahead.
- **Figma source of truth:** Token-Extract file, fileKey `37octxSrI0LdBzX148HlbI` — its own "00 — Read Me" page (node `53:1290`) has the full build log for the design-system side. Read that before assuming anything about current Figma state; another session has been actively working that file in parallel.
- **This file** lives at the root of this branch/worktree so it travels with the code.

## Commits so far (3, all pushed)

1. `a304f1b` — `style(tokens): restyle neutral colors to Design Spine values (DEC-73)` — the core value-only swap in `app/globals.css`
2. `87f6f5f` — `fix(cta): stop primary/secondary CTAs inverting or breaking in Light mode` — real bugs found via live browser check, not part of the original plan, just caught along the way
3. `1eff6f6` — `style(type): repoint display type scale to Design Spine measured values (DEC-74)` — `--f-display-tile/feature/hero` repointed 26/36/72px → 22/28/68px. **Chosen "repoint, don't add new slots"** per tokens.md's measured values (trending-card/leaderboard-title/home-hero respectively) — same order preserved (hero>feature>tile), same value-only-swap strategy as the color commits. `--f-xxs`/`-sm`/`-md`/`-2xl` needed no change (already 10/12/13/17px by coincidence). **Browser-verified same session, after the Chrome extension got reconnected** — see verified section below.

## Exact scope of what changed

**Dark `:root` block:**
| Token | Old | New | Note |
|---|---|---|---|
| `--bg`/`--bg-2`/`--bg-3` | — | unchanged | already numerically identical to Design Spine |
| `--fg` | `#ffffff` | `#f7f6f3` | |
| `--muted`/`-2`/`-3` | old white-based rgba | new fg-muted family | opacity mostly unchanged, base rgb changed |
| `--border`/`--bdr`/`--lbdr` | 3 different lavender-tinted values | 1 shared value | Design Spine has one border token, not three — collapsed onto it rather than renaming 3→1 |
| `--on-media` | `#ffffff` | `#f7f6f3` | theme-invariant, same value in both modes by design |
| `--danger` | `#F87171` | `#ff5449` | matches this session's earlier Figma contrast fix |
| `--royal-600` | `#7B2FBF` (purple accent) | `#171717` | repurposed as the fixed-ink primary-button fill (Design Spine's `bg-media`) — see below |
| `--mut2`/`-3`/`-4` | — | untouched | 0 file references anywhere in the app, not part of the new system, no reason to touch |

**Light `[data-theme="light"]` block:** same pattern — `--bg`/`-2`/`-3` updated to `#ffffff`/`#f5f5f3`/`#ebebe7`, `--fg` unchanged (already matched), `--muted`/`-2` updated, `--border`/`--bdr`/`--lbdr` collapsed the same way, `--danger` **added** (`#c81e1e` — didn't have a Light override at all before).

**Component-level CSS fixes (2nd commit, found via live browser check, not planned in advance):**
- `.cta-primary` — was `background: var(--fg); color: var(--bg);`, which **inverts with theme**. Wrong — Design Spine's primary buttons are fixed-ink, must stay dark-filled + light-text in *both* modes. Switched to `--royal-600`/`--on-media` (both already theme-invariant). Hover changed from a color-swap to a plain opacity dip — no Design Spine evidence exists for hover states at all (same as focus was, before this session's Figma work), so treat that as an unverified placeholder, not a spec. `:focus-visible` fixed from a stale `var(--lav)` outline (retired token) to the approved focus-ring rule (`on-media`, 2px, flush).
- `.cta-secondary` — `color` and hover `border-color` were hardcoded `rgba(255,255,255,*)` literals — genuinely broken in Light mode (near-invisible white-on-white), unrelated pre-existing bug just surfaced by testing Light mode properly. Switched to `--muted`/`--muted-2`. Same stale-`--lav` focus fix as above (`fg`, 2px, flush, since this button has no fill).
- `.divrow::after`, `.catalogue-row` — same class of hardcoded-rgba-in-Dark-only bug on a divider line and a row border/hover state. Fixed using `--line`/`--border`/`--muted-3`.

## Deliberately NOT touched — real decisions, not oversights

- **`--lav`/`--lav-*`, `--map-pin*`, `--void*`, `--energy`** — accent colors. Design Spine has **no accent color at all** (confirmed this session, every sampled screen is grayscale + one red). Retiring these needs someone to decide what actually replaces map pins / AI-signal chrome — that's a UX call, not a mechanical value swap. (`--royal-600` was the one exception touched, because it's genuinely just a plain button-fill slot, not a designed accent moment.)
- **`.cta-ai`, `.catalogue-row`'s `[aria-selected]`/`.selected`/`:focus-visible` states** — still on `--lav`/`--energy`. Left alone on purpose: fixing just the focus ring while the background stays lavender would look inconsistent. Same deferred bucket as above.
- **`--muted-3` in Light mode** — `tokens.md` itself flags this as unconfirmed (never observed bound on any real Light-mode Spine frame). Left on its old value rather than guessed.
- **Typography** — done in commit `1eff6f6` (this session). See commit list above.
- **Spacing** (`--sp-*`) — untouched. Old 8-step scale vs. Design Spine's only-confirmed set (24/32/48/64/96 as real bound Figma variables; everything under 24px is documented as "evidence, not tokens" — no confirmed micro-spacing system exists yet). Same category as typography: needs a decision, not a mechanical swap.

## What's verified, and how — redo the check, don't trust the claim

- `npx tsc --noEmit` clean on all three commits.
- **Live browser check via `getComputedStyle(document.documentElement)`** on `localhost:3001`, both themes (toggle by setting `document.documentElement.setAttribute('data-theme', 'dark'|'light')` directly via the JS tool) — every color var confirmed byte-for-byte against the Figma values. **This is the method that matters** — pull computed values, don't eyeball a screenshot and call it verified.
- **Typography commit (`1eff6f6`) browser-verified in a follow-up pass, same day** — the Chrome-extension pairing gap below got resolved mid-session (turned out to just need the human to actually connect the extension; `list_connected_browsers` went from `[]` to showing a device once they did). Verified all three slots by reading the *actual rendered* `getComputedStyle(h1).fontSize`, not just the CSS var: Home hero → 68px (both themes, screenshot clean, no clipping, viewport confirmed 952px so this is the desktop value not the mobile override), `/en/leaderboard` title → 22px (renders via the `tile` class, not `feature` — confirmed by reading the element's actual className, don't assume from the page name), `/en/explore` title → 28px (`feature` class). Zero console errors on all three pages.
- Screenshot-checked Home (`/en`) in both themes after each commit — no layout regressions, no clipping.
- Zero console errors on page load, checked via `read_console_messages`, on Home/Leaderboard/Explore.
- Gitleaks clean on all three commits (pre-commit hook).

## What's NOT verified — real gaps

- **Only Home, Leaderboard, and Explore have been visually checked.** Every other route (Map, Saved, Profile, Plan, Search, auth, detail pages like Filming Spots/Heritage/Collection, etc.) — zero visual check, including the ones using `--f-display-tile` for their `<h1>` (grep list is in the previous session's work — re-grep, don't trust it's still accurate). Given the hardcoded-rgba bug pattern found on Home, the same class of bug likely exists elsewhere. Needs a real grep + browser sweep per page, not an assumption in either direction.
- **Only `/en` locale checked.** The other 4 (ko, ja, zh-TW, pt-BR) — nothing checked, including text-length/wrap behavior. Locale font stacks (`:lang(ko)` etc.) don't override the *size* vars, only family/line-height, so the new sizes apply to all locales identically — but real text at 22/28/68px in Korean/Japanese/Chinese hasn't been eyeballed for wrap/overflow.
- **Only desktop viewport** (~952-1092px, confirmed via `window.innerWidth`) screenshotted. Mobile (375px, and specifically the 767px breakpoint where `--f-display-hero` gets a separate 28px override) — nothing checked. That override wasn't touched this session and its own value (28px) now coincidentally matches the new desktop `--f-display-feature` value — harmless (different vars) but worth being aware of if grepping for "28px" gets confusing.
- **No accessibility check** (axe, keyboard nav, contrast beyond the color values themselves) run against anything in this branch.

## Practical gotchas hit this session — avoid repeating

- **`.env.local`** — the Bash tool blocks *any* command that references it, even a plain `cp` or a chained existence-check. This is a permission guard, not a bug — ask the human to copy it in manually, don't look for a workaround.
- **Background dev servers survive a Claude Code session restart** as orphaned processes. Check `lsof -i :<port>` before assuming you need a fresh one — "port already in use" usually means the old server is still fine, not a conflict to fight.
- **Base-ref mistakes are real** — this branch was originally cut from `origin/devtest`, then explicitly recreated from `origin/main` mid-session per direct instruction. Confirm the base ref you actually want *before* creating a worktree; fixing it after means deleting the branch/worktree and redoing it (only safe if nothing's been pushed under the old base yet).
- **Chrome extension connection is flaky across session restarts** — a "not connected" error even when the human confirms the extension is running usually means the *session* needs restarting (the MCP handshake happens at session start), not the extension itself. This session saw the harder version of that: `list_connected_browsers` came back completely empty three times in a row, and `switch_browser` broadcast found nothing to pair with even after the human said it was hooked up. **What actually fixed it: the human just hadn't connected it yet** (or the extension itself hadn't been (re)paired to this account) — the next attempt after they did came back with a device immediately, no session restart needed. So: if this happens again, don't assume it needs a full session restart — first just ask the human to check/click through the extension's own connect flow, it may really be that simple.

## Immediate next steps, in priority order

1. **Sweep every other route** for the same hardcoded-rgba-literal + theme-inversion pattern found on Home. Grep first (`rgba(255,255,255` / `rgba(0,0,0` outside `globals.css`, across `app/` and `components/`), then browser-verify each hit individually — don't batch-fix blind.
2. **Mobile viewport + other-locale check**, once desktop/`en` is solid.
3. **Only after all of the above:** bring it back for a full review. Do not merge PR #188 without explicit go-ahead — this was said directly, more than once.

## Related context worth reading first

- `.claude/rules/tokens.md` (B4K_v1.0 root repo) — the actual Design Spine token spec, including its own honest gaps (typography/spacing/motion not fully measured)
- `.claude/rules/workflow.md`'s PR Regulations section — `devtest` is `B4KFrontend`'s real middle branch, not `main`
- Figma file `37octxSrI0LdBzX148HlbI`, page "00 — Read Me" (node `53:1290`) — full build history of the Design Spine system, including two real incidents from earlier this session (a silent instance reversion, an orphan-floating-component mistake) and how they were caught — useful pattern reference if something in Figma looks subtly wrong again
- PR #188 itself — same scope/test-plan info, more condensed

---
Written 2026-09-17, by a Claude Code session on a different account than whoever reads this next.
Updated 2026-09-17, by yet another account — added the typography commit, and the harder browser-pairing gap noted above.
