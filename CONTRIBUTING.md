# Contributing — B4KFrontend

Canonical process doc: product owner's B4K workspace, `.claude/rules/workflow.md` (auto-loaded by Claude Code). This file is the GitHub-native summary — if the two ever disagree, `workflow.md` wins.

## Branches

Two-tier flow — `main` is never a direct PR target for feature work:

```
feature/<slug>, fix/<slug>, preview/<slug>  →  PR  →  devtest  →  PR (batched)  →  main
```

- `devtest` = pre-prod staging branch, always-on Vercel Preview deploy, Staging Supabase project. Every feature/fix PRs here first.
- `main` = production, deploys to Vercel Production on merge. Only reached via a `devtest` → `main` promotion PR, opened once a batch of `devtest` changes is verified on its Preview URL — not on every feature merge.
- **Direct push to `main` is disallowed, effective now** — no grace period, unlike the rest of branch protection (target Jul 31 retro).

| Work type | Branch required? |
|---|---|
| Experimental / preview / spike | Yes — always |
| New screen or feature | Yes |
| Bug fix touching ≥2 files | Yes |
| Single-file doc/config tweak | Optional |

Naming: `feature/<slug>` · `fix/<slug>` · `preview/<slug>`

## PRs

- Every change lands on `devtest` via PR first — even before branch protection is turned on (target: after the Jul 31 sprint retro), treat direct push to `devtest` as deprecated.
- No required reviewer — one owner on this repo. PR value is the CI gate + Vercel Preview URL + rollback point, not peer review. Self-merge once checks are green.
- Required checks (already running in `.github/workflows/ci.yml` + `security.yml`): lint, typecheck, build, i18n-keys, token-compliance, gitleaks.
- Squash merge, delete branch after.
- Describe what changed + why + test plan in the PR body (template auto-fills).

## Environments

| Vercel env | Trigger | Supabase project |
|---|---|---|
| Production | merge to `main` | Production |
| Preview — `devtest` | push/merge to `devtest` | Staging — this is the pre-prod test deployment |
| Preview — feature branches | any other branch push / open PR | Staging |
| Development | local `next dev` | Staging |

Never point any Preview deployment (including `devtest`) at the Production Supabase project.

## Secrets

Never commit real keys. `.env.example` has placeholders for every var — see `@.claude/rules/security.md` for the full policy. Pre-commit gitleaks hook blocks secrets on staged changes (`git config core.hooksPath .githooks` — one-time setup).

## Commits

```
[Feat]  MP_01 MapDefault — mobile + desktop, all states, i18n, wired
[Fix]   POICard loading skeleton height mismatch
[Style] token-align: MapDefault
[i18n]  extract: MapDefault — 7 languages
[Docs]  update CLAUDE.md: section 12
```
