# Design tokens

`tokens.json` holds the B4K design tokens in the W3C design-token format, generated from the
**B4K UI Foundations** Figma file (the source of truth). Each token keeps its Figma name as the
path, its CSS name (`$extensions.b4k.css`) and every Figma mode (`$extensions.b4k.modes`).

```
npm run tokens:build
```

writes two generated files (never edit them by hand):

| Output | What |
|---|---|
| `app/tokens.css` | CSS custom properties for every token and mode, imported in `app/layout.tsx` |
| `tokens/tailwind-preset.ts` | Tailwind keys for the semantic tokens and a `.type-*` class per text style, loaded as a preset in `tailwind.config.ts` |

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

To change a value: change it in Figma (with a decision), re-export `tokens.json`, run
`npm run tokens:build`, commit all three files. The old variables in `app/globals.css` stay until
every page has moved over.
