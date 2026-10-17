# Design tokens

`tokens.json` holds the B4K design tokens in the W3C design-token format, generated from the
**B4K UI Foundations** Figma file (the source of truth). Each token keeps its Figma name as the
path, its CSS name (`$extensions.b4k.css`) and every Figma mode (`$extensions.b4k.modes`).

```
npm run tokens:build
```

writes three generated files (never edit them by hand):

| Output | What |
|---|---|
| `app/tokens.css` | CSS custom properties for every token and mode, imported in `app/layout.tsx` |
| `tokens/tailwind-preset.ts` | Tailwind keys for the semantic tokens and a `.type-*` class per text style, loaded as a preset in `tailwind.config.ts` |
| `tokens/colors.ts` | Hex per theme (`TOKEN_HEX.light` / `.dark`: plan day fill and text, map pin) for code that can't read CSS variables, the Naver Maps SDK |

Mode mapping: Color and Component `Light` = `:root` / `[data-theme="light"]`, `Dark` =
`[data-theme="dark"]`; Typography `en` = `:root`, other locales = `:root:lang(<locale>)`;
Responsive `Mobile` = base, `Tablet` = `min-width: 768px`, `Desktop` = `min-width: 1024px`.

Using them:

- Colors: `bg-ui-bg`, `text-ui-fg`, `text-ui-fg-muted`, `border-ui-border`, `bg-plan-day-1` …
  (the `ui-` prefix keeps them apart from the old `bg`, `fg`, `danger` keys until those are removed)
- Text: `type-display-hero`, `type-body-base`, `type-label-button` …
- Spacing, font sizes and radius: the Tailwind defaults already match the tokens (`p-4` = `space/4`,
  `text-sm` = `font-size/sm`, `rounded-2xl` = `radius/2xl`); `text-2xs` is the one extra size
- Anything else: `var(--token-name)`, e.g. `h-[var(--control-height-md)]`
- Joining classes in components: `cn()` from `lib/cn.ts` (clsx + tailwind-merge, taught the extra
  token keys); variants with `cva` (class-variance-authority)
- `dark:` variants follow the app theme (`<html data-theme="dark">`), not the OS setting

## Updating from Figma

Values change only in Figma, with a decision row in the B4K UI Worksheet. Then:

1. Read the variables from B4K UI Foundations with the Figma plugin API. Claude runs the read
   script `ui-catalog/figma_reads/tokens_export.js` (B4K_v4.0 workspace) through the Figma
   connector; it returns every variable with its code name and mode values, plus the text, effect
   and paint styles.
2. Convert with `ui-catalog/work/code/figma_to_dtcg.py figma_export.json tokens/tokens.json`.
3. `npm run tokens:build`, check the diff of `app/tokens.css` (it shows exactly what changed),
   commit `tokens.json` and the generated files together.

The Figma Variables REST API needs an Enterprise plan, so the export goes through the plugin API
instead of a CI job. A Figma plugin that writes the same JSON (for example Tokens Studio or
Variables to JSON) could replace step 1 later if the designer wants to run it without Claude. The old variables in `app/globals.css` stay until
every page has moved over.
