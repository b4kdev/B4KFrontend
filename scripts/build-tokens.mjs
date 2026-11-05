#!/usr/bin/env node
// Builds the B4K design tokens into code.
//
//   tokens/tokens.json  ->  app/tokens.css          (CSS custom properties, every mode)
//                       ->  tokens/tailwind-preset.ts (Tailwind theme keys + text style classes)
//                       ->  tokens/colors.ts         (hex per theme for the Naver Maps SDK)
//
// tokens.json is generated from the B4K UI Foundations Figma file — never edit it or the outputs
// by hand. Change the value in Figma (with a decision), re-export, then `npm run tokens:build`.
//
// Mode mapping (Figma collection -> CSS):
//   Color, Component   Light = :root and [data-theme="light"], Dark = [data-theme="dark"]
//   Typography         en = :root, other locales = :root:lang(<locale>)
//   Responsive         Mobile = :root, Tablet = min-width 768px, Desktop = min-width 1024px
//   everything else    one value on :root (Code: code-only tokens with no Figma variable, by decision)
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'))

// ── Collect tokens ───────────────────────────────────────────────────────────
const tokens = [] // { path, type, value, collection, css, modes }
const walk = (node, path) => {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue
    if (v && typeof v === 'object' && '$value' in v) {
      const b4k = v.$extensions.b4k
      tokens.push({ path: [...path, k].join('.'), type: v.$type, value: v.$value, ...b4k })
    } else if (v && typeof v === 'object') {
      walk(v, [...path, k])
    }
  }
}
walk(src, [])
const byPath = Object.fromEntries(tokens.map((t) => [t.path, t]))

// Every family is self-hosted through next/font (app/layout.tsx) under these CSS variables.
// Onest carries Latin in every locale; Hangul falls through to Pretendard (self-hosted, dynamic
// subset, app/layout.tsx), Japanese and Traditional Chinese to their Noto faces.
const FONT_VARS = {
  // Moderniz: the English hero and hub only (brand face, capitals; no accented capitals, so
  // Portuguese keeps Onest).
  Moderniz: "var(--font-moderniz), var(--font-onest), 'Pretendard Variable', 'Pretendard'",
  Onest: "var(--font-onest), 'Pretendard Variable', 'Pretendard'",
  Pretendard: "var(--font-onest), 'Pretendard Variable', 'Pretendard'",
  'Noto Sans JP': 'var(--font-onest), var(--font-ui-noto-sans-jp)',
  'Noto Sans TC': 'var(--font-onest), var(--font-ui-noto-sans-tc)',
}
const fontStack = (family, kind) => {
  if (!FONT_VARS[family]) throw new Error(`font ${family} is not loaded in app/layout.tsx; add it there and to FONT_VARS`)
  return [FONT_VARS[family], kind === 'display' ? 'sans-serif' : 'system-ui, sans-serif'].join(', ')
}

const cssValue = (t, v) => {
  if (typeof v === 'string' && v.startsWith('{')) {
    const target = byPath[v.slice(1, -1)]
    if (!target) throw new Error(`${t.path}: unknown reference ${v}`)
    return `var(${target.css})`
  }
  switch (t.type) {
    case 'dimension':
      return v === 0 ? '0' : `${v}px`
    case 'duration':
      return `${v}ms`
    case 'fontFamily':
      return fontStack(v, t.path.endsWith('display') ? 'display' : 'body')
    case 'number':
      return t.path.startsWith('tracking.') ? `${v}em` : String(v)
    default:
      return String(v)
  }
}

// ── tokens.css ───────────────────────────────────────────────────────────────
const blocks = new Map() // selector -> lines
const add = (selector, line) => {
  if (!blocks.has(selector)) blocks.set(selector, [])
  blocks.get(selector).push(line)
}
const LOCALE_SELECTOR = (m) => (m === 'en' ? ':root' : `:root:lang(${m})`)
const RESPONSIVE = {
  Mobile: ':root',
  Tablet: '@media (min-width: 768px) { :root',
  Desktop: '@media (min-width: 1024px) { :root',
}

for (const t of tokens) {
  if (!t.modes) {
    add(':root', `  ${t.css}: ${cssValue(t, t.value)};`)
    continue
  }
  for (const [mode, v] of Object.entries(t.modes)) {
    let sel
    if (t.collection === 'Color' || t.collection === 'Component') {
      sel = mode === 'Light' ? ':root,\n[data-theme="light"]' : '[data-theme="dark"]'
    } else if (t.collection === 'Typography') {
      // Only write a locale block where the value differs from en.
      if (mode !== 'en' && v === t.modes.en) continue
      sel = LOCALE_SELECTOR(mode)
    } else if (t.collection === 'Responsive') {
      sel = RESPONSIVE[mode]
    } else {
      throw new Error(`${t.path}: no mode mapping for collection ${t.collection}`)
    }
    add(sel, `  ${t.css}: ${cssValue(t, v)};`)
  }
}

// Effect and paint styles
const ext = src.$extensions.b4k
add(':root', `  --focus-ring: ${ext.effects['focus/ring']};`)
add(':root', `  --gradient-overlay-fade: ${ext.paints['gradient/overlay-fade']};`)

const order = [
  ':root',
  ':root,\n[data-theme="light"]',
  '[data-theme="dark"]',
  ...['pt-BR', 'ko', 'ja', 'zh-TW'].map(LOCALE_SELECTOR),
  RESPONSIVE.Tablet,
  RESPONSIVE.Desktop,
]
let css = `/* GENERATED by scripts/build-tokens.mjs from tokens/tokens.json — do not edit.
 * Source of truth: B4K UI Foundations (Figma). ${tokens.length} tokens. */\n`
for (const sel of order) {
  const lines = blocks.get(sel)
  if (!lines) continue
  const media = sel.startsWith('@media')
  css += `\n${sel} {\n${lines.map((l) => (media ? '  ' + l : l)).join('\n')}\n${media ? '  }\n}' : '}'}\n`
}
for (const sel of blocks.keys()) if (!order.includes(sel)) throw new Error(`unordered block ${sel}`)
writeFileSync(join(root, 'app/tokens.css'), css)

// ── Tailwind preset ──────────────────────────────────────────────────────────
// Semantic tokens only (primitives stay hidden, as in Figma). Font sizes, spacing and radius
// already equal the Tailwind defaults, so only the extra keys are added.
// Colors sit under `ui-` while the old theme keys (bg, fg, danger …) still exist; the prefix is
// dropped in the clean-up phase (phase 7).
const v = (path) => `var(${byPath[path].css})`
const group = (prefix) =>
  Object.fromEntries(
    tokens.filter((t) => t.path.startsWith(prefix + '.')).map((t) => [t.path.slice(prefix.length + 1), v(t.path)]),
  )
const colorGroup = (prefix) =>
  Object.fromEntries(
    tokens
      .filter((t) => t.path.startsWith(prefix + '.') && t.type === 'color')
      .map((t) => [t.path.slice(prefix.length + 1), v(t.path)]),
  )
const colors = {
  ui: group('color'),
  plan: group('plan'),
  'map-ui': colorGroup('map'),
  // Colour fields: categories, hero, plan actions, accents, nav tiles, tile and control surfaces.
  category: colorGroup('category'),
  field: colorGroup('field'),
  action: colorGroup('action'),
  accent: colorGroup('accent'),
  nav: colorGroup('nav'),
  tile: colorGroup('tile'),
  control: colorGroup('control'),
  sheet: colorGroup('sheet'),
  photo: colorGroup('photo'),
}
// Squircle radii (plain border-radius). The Tailwind defaults (rounded-sm, rounded-lg …) keep
// their own values; these sit under their own keys.
const radii = {
  'sq-xs': v('radius.xs'),
  'sq-sm': v('radius.sm'),
  'sq-md': v('radius.md'),
  'sq-lg': v('radius.lg'),
  tile: v('radius.tile'),
  'tile-inner': v('radius.tile-inner'),
}
const durations = Object.fromEntries(
  tokens.filter((t) => t.type === 'duration').map((t) => [t.path.slice('duration.'.length), v(t.path)]),
)
const easings = Object.fromEntries(
  tokens.filter((t) => t.type === 'cubicBezier').map((t) => [t.path.slice('easing.'.length), v(t.path)]),
)

// Code-only stacking order: z-dropdown, z-modal, z-toast … next to the Tailwind numbers.
const zIndex = group('z')

const LEADING = { 1: 'none', 1.1: 'display', 1.25: 'tight', 1.375: 'snug', 1.5: 'normal' }
const textStyles = Object.fromEntries(
  ext.textStyles.flatMap((s) => {
    // A leading token by name ('display') or by value; a value without a token is written as is.
    const lh = typeof s.lh === 'string' ? s.lh : LEADING[s.lh]
    const rule = {
      fontFamily: `var(--font-family-${s.fam})`,
      fontSize: s.sz,
      fontWeight: s.wt,
      lineHeight: lh ? `var(--leading-${lh})` : String(s.lh),
      letterSpacing: typeof s.ls === 'string' ? s.ls : s.ls ? `${s.ls}em` : '0',
    }
    if (s.tc === 'UPPER') rule.textTransform = 'uppercase'
    if (s.wrap) rule.textWrap = s.wrap
    if (s.num) rule.fontVariantNumeric = s.num
    // The :lang copies outrank the live :lang(ko|ja|zh-TW) line-height in app/globals.css, so the
    // token leading applies in every language (B4K UI Foundations has one leading per style).
    const cls = `.type-${s.n.replace('/', '-')}`
    // Negative tracking and a leading under 1.1 are set for Latin headings: Hangul, kana and Han
    // glyphs collide and stacked lines clip. A style with a fixed tracking or leading gets its own
    // CJK copy: Korean keeps half the tracking (as the display tokens do) with a leading of at least
    // 1.1; Japanese and Traditional Chinese no tracking and at least 1.15. The display tokens
    // (--tracking-display, --leading-display) already have per-language modes and are left as they are.
    const neg = typeof s.ls === 'number' && s.ls < 0
    const fixedLh = typeof s.lh === 'number'
    if (!neg && !(fixedLh && s.lh < 1.15)) {
      return [[[cls, ...['ko', 'ja', 'zh-TW'].map((l) => `${cls}:lang(${l})`)].join(', '), rule]]
    }
    const lhAtLeast = (min) => (fixedLh && s.lh < min ? String(min) : rule.lineHeight)
    return [
      [cls, rule],
      [`${cls}:lang(ko)`, { ...rule, lineHeight: lhAtLeast(1.1), letterSpacing: neg ? `${s.ls / 2}em` : rule.letterSpacing }],
      [`${cls}:lang(ja), ${cls}:lang(zh-TW)`, { ...rule, lineHeight: lhAtLeast(1.15), letterSpacing: neg ? '0' : rule.letterSpacing }],
    ]
  }),
)

const preset = `// GENERATED by scripts/build-tokens.mjs from tokens/tokens.json — do not edit.
// Source of truth: B4K UI Foundations (Figma).
import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const b4kTokens: Partial<Config> = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 2).replace(/\n/g, '\n      ')},
      fontFamily: {
        'ui-display': ['var(--font-family-display)'],
        'ui-body': ['var(--font-family-body)'],
      },
      fontSize: {
        '2xs': 'var(--font-size-2xs)',
      },
      borderRadius: ${JSON.stringify(radii, null, 2).replace(/\n/g, '\n      ')},
      boxShadow: {
        'focus-ring': 'var(--focus-ring)',
${tokens.filter((t) => t.path.startsWith('shadow.')).map((t) => `        '${t.path.slice(7)}': 'var(${t.css})',`).join('\n')}
      },
      backgroundImage: {
        'overlay-fade': 'var(--gradient-overlay-fade)',
      },
      // Motion patterns from the Motion spec: skeleton pulse, indeterminate progress.
      keyframes: {
        'b4k-pulse': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        'b4k-indeterminate': { '0%': { left: '-40%' }, '100%': { left: '100%' } },
        'b4k-sheet-in': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'b4k-drawer-in': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'b4k-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'b4k-pulse': 'b4k-pulse calc(var(--duration-long4) * 2) var(--easing-standard) infinite',
        'b4k-indeterminate': 'b4k-indeterminate var(--duration-long2) var(--easing-linear) infinite',
        'b4k-sheet-in': 'b4k-sheet-in var(--duration-medium2) var(--easing-emphasized-decelerate)',
        'b4k-drawer-in': 'b4k-drawer-in var(--duration-medium2) var(--easing-emphasized-decelerate)',
        'b4k-fade-in': 'b4k-fade-in var(--duration-short4) var(--easing-standard)',
      },
      transitionDuration: ${JSON.stringify(durations, null, 2).replace(/\n/g, '\n      ')},
      transitionTimingFunction: ${JSON.stringify(easings, null, 2).replace(/\n/g, '\n      ')},
      zIndex: ${JSON.stringify(zIndex, null, 2).replace(/\n/g, '\n      ')},
    },
  },
  plugins: [
    // Text styles from B4K UI Foundations: class .type-<group>-<name>, e.g. .type-display-hero
    plugin(({ addComponents }) => {
      addComponents(${JSON.stringify(textStyles, null, 2).replace(/\n/g, '\n      ')})
    }),
  ],
}

export default b4kTokens
`
writeFileSync(join(root, 'tokens/tailwind-preset.ts'), preset)

// ── Hex per theme for code that can't read CSS variables (Naver Maps SDK) ───
const hexIn = (path, mode) => {
  let v = byPath[path].modes ? byPath[path].modes[mode] : byPath[path].value
  while (typeof v === 'string' && v.startsWith('{')) {
    const t = byPath[v.slice(1, -1)]
    v = t.modes ? t.modes[mode] : t.value
  }
  return v
}
const dayPaths = tokens.filter((t) => /^plan\.day-\d+$/.test(t.path)).map((t) => t.path)
const themeBlock = (mode) =>
  `  ${mode.toLowerCase()}: {
    planDays: [
${dayPaths.map((p, i) => `      { fill: '${hexIn(p, mode)}', fg: '${hexIn(`${p}-fg`, mode)}' }, // day ${i + 1}`).join('\n')}
    ],
    mapPin: { fill: '${hexIn('map.pin-fill', mode)}', stroke: '${hexIn('map.pin-stroke', mode)}', selected: '${hexIn('map.pin-selected', mode)}' },
    mapType: { ${['food', 'cafe', 'stay', 'shopping', 'heritage', 'park', 'other'].map((k) => `${k}: '${hexIn(`map.type-${k}`, mode)}'`).join(', ')} },
    cluster: { fill: '${hexIn('map.cluster-fill', mode)}', fg: '${hexIn('map.cluster-fg', mode)}', stroke: '${hexIn('map.cluster-stroke', mode)}' },
    routeCasing: ${hexIn('map.route-casing', mode) === 'transparent' ? 'null' : `'${hexIn('map.route-casing', mode)}'`},
  },`
const colorsTs = `// GENERATED by scripts/build-tokens.mjs from tokens/tokens.json — do not edit.
// Hex per theme for code that cannot use CSS variables (the Naver Maps SDK). Everywhere else
// use the CSS variables (var(--plan-day-1) …) or the Tailwind keys (bg-plan-day-1 …).
export const TOKEN_HEX = {
${themeBlock('Light')}
${themeBlock('Dark')}
} as const
`
writeFileSync(join(root, 'tokens/colors.ts'), colorsTs)

console.log(`tokens: ${tokens.length} variables, ${ext.textStyles.length} text styles -> app/tokens.css, tokens/tailwind-preset.ts, tokens/colors.ts`)
