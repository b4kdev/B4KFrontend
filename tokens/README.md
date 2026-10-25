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
  (the preset is the only Tailwind theme; the `ui-` prefix is part of the key names)
- Text: `type-display-hero`, `type-body-base`, `type-label-button` …
- Spacing, font sizes and radius: the Tailwind defaults already match the tokens (`p-4` = `space/4`,
  `text-sm` = `font-size/sm`, `rounded-2xl` = `radius/2xl`); `text-2xs` is the one extra size
- Anything else: `var(--token-name)`, e.g. `h-[var(--control-height-md)]`
- Joining classes in components: `cn()` from `lib/cn.ts` (clsx + tailwind-merge, taught the extra
  token keys); variants with `cva` (class-variance-authority)
- `dark:` variants follow the app theme (`<html data-theme="dark">`), not the OS setting

## Updating from Figma

Values change only in Figma, with a recorded design decision. Then:

1. Read the variables from B4K UI Foundations with the Figma plugin API (export script kept in
   the design workspace; ask the product team). It returns every variable with its code name and mode values,
   plus the text, effect and paint styles, converted to `tokens/tokens.json`.
2. `npm run tokens:build`, check the diff of `app/tokens.css` (it shows exactly what changed),
   commit `tokens.json` and the generated files together.

The Figma Variables REST API needs an Enterprise plan, so the export goes through the plugin API
instead of a CI job. A Figma plugin that writes the same JSON (for example Tokens Studio or
Variables to JSON) could replace step 1 later. `app/globals.css` holds only the base styles
(Tailwind layers, theme color scheme, reduced motion); every value comes from `app/tokens.css`.

## Code-only tokens

Some rules have no Figma variable, so they live only in `tokens.json` (collection `Code`) and are
edited there, then built like the rest:

- **Stacking order** `z/*`: `base` 0, `map-controls` 10, `dropdown` 1000, `sticky` 1020, `fixed` 1030,
  `drawer-backdrop` 1040, `drawer` 1045, `modal-backdrop` 1050, `modal` 1055, `popover` 1070,
  `tooltip` 1080, `toast` 1090 (toasts above everything; the Naver map keeps its own layers inside its
  box). Tailwind: `z-dropdown`, `z-modal`, `z-toast` …; CSS: `var(--z-toast)`. Components still on the
  Tailwind numbers (`z-30`, `z-50`) move to these keys one at a time, checked against the drawn frames.
- **Safe areas** `layout/safe-area-*`: `var(--layout-safe-area-top)` … = `env(safe-area-inset-*, 0px)`.
  A bar fixed to a screen edge adds the matching one to its own padding.
- **Icons**: Lucide icons take `currentColor`. A decorative icon is hidden from screen readers (Lucide
  adds `aria-hidden="true"` unless the icon gets an accessible name); an icon-only control has an
  accessible name (`aria-label` from a Copy Deck text). The axe runs of the QA kit check the names.

## Version

`$extensions.b4k.version` in `tokens.json` follows semver: major = a token renamed or removed, minor =
a new token, patch = a value fixed. It becomes `1.0.0` when B4K UI Foundations is published and frozen
as library v1; until then it is `1.0.0-rc.N`. A retired token is listed with its replacement, never
silently deleted.
