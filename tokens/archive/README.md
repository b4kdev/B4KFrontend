# Archived — dead Style Dictionary config

Archived 2026-08-07. Both configs pointed at `../../B4KVault/tokens/*.json` in the `B4K_v1.0` root
repo — that source was itself archived to `B4KVault/archive/tokens/` the same day. Confirmed dead
before that too: `style-dictionary` was never in `package.json`, no `styles/generated/` output
ever existed, and no code imports either file (`grep` across `B4KFrontend` for
`style-dictionary` returns zero hits outside this directory). `globals.css` has been the real
runtime token authority the whole time — see `.claude/rules/tokens.md` in the root repo.
