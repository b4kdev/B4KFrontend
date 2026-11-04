#!/usr/bin/env node
// Token lint: fails hard-coded colors and spacing in app/ and components/.
//
// Colors and spacing come from the design tokens only (CSS variables from app/tokens.css, the
// Tailwind keys of tokens/tailwind-preset.ts). Flagged:
//   colors   Tailwind palette classes (bg-gray-100, text-white), color functions (rgb(), hsl(), ...),
//            hex in CSS files, literal colors in arbitrary values (bg-[white]) and in style objects
//   spacing  Tailwind's default spacing scale on spacing utilities (p-4, top-1, -mt-px), raw
//            lengths in their arbitrary values (gap-[1rem], top-[calc(100%+4px)]), raw numbers
//            and lengths in style objects (padding: 16) and in CSS spacing properties
//
// A line that must keep a raw value (a renderer that cannot read CSS variables, such as
// ImageResponse or the web manifest) carries an `allow-raw` or `allow-hex` comment with its reason.
// Generated files (app/tokens.css) and stories, tests and specs are skipped.
//
//   npm run lint:tokens
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SKIP_FILE = /\.(stories|test|spec)\.[tj]sx?$|(^|\/)app\/tokens\.css$/

const files = []
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'test') walk(p) }
    else if (/\.(tsx?|css)$/.test(e.name) && !SKIP_FILE.test(relative(root, p))) files.push(p)
  }
}
walk(join(root, 'app'))
walk(join(root, 'components'))

const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const NAMED = 'white|black|red|green|blue|gray|grey|orange|yellow|purple|pink|silver|navy|maroon'
const COLOR_UTIL = '(?:bg|text|border(?:-[trblxyse])?|ring|ring-offset|fill|stroke|from|via|to|outline|divide|placeholder|caret|accent|decoration|shadow)'
const SPACE_UTIL = '(?:p[trblxyse]?|m[trblxyse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end|scroll-[mp][trblxyse]?)'
const VARIANTS = '(?:[a-z0-9-]+:|\\[[^\\]\\s]+\\]:)*'
const RAW_LENGTH = '(?<![\\w-])(?:\\d*\\.)?\\d+(?:px|rem|em)\\b'
const SPACE_PROP = '(?:padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)(?:-[a-z-]+)?'
const SPACE_KEY = '(?:padding|margin|gap|rowGap|columnGap|inset|top|right|bottom|left)(?:Top|Bottom|Left|Right|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?'
const COLOR_KEY = '(?:color|background|backgroundColor|borderColor|border|outlineColor|fill|stroke|boxShadow|textShadow)'

const TS = /\.tsx?$/
const CSS = /\.css$/
const rules = [
  { name: 'Tailwind palette color class', only: TS,
    re: new RegExp(`(?<![\\w-])${VARIANTS}${COLOR_UTIL}-(?:(?:${PALETTE})-\\d{2,3}|white|black)(?:\\/\\d+)?(?![\\w-])`, 'g') },
  { name: 'color function', re: /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g },
  { name: 'hex color', only: CSS, re: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'literal color in arbitrary value', only: TS,
    re: new RegExp(`(?<![\\w-])${VARIANTS}${COLOR_UTIL}-\\[[^\\]]*\\b(?:${NAMED})\\b[^\\]]*\\]`, 'g') },
  { name: 'literal color in style object', only: TS,
    re: new RegExp(`\\b${COLOR_KEY}\\s*:\\s*['"\`][^'"\`]*\\b(?:${NAMED})\\b`, 'g') },
  { name: 'Tailwind default spacing scale', only: TS,
    re: new RegExp(`(?<![\\w-])${VARIANTS}-?${SPACE_UTIL}-(?:[1-9]\\d*(?:\\.5)?|0\\.5|px)(?![\\w./-])`, 'g') },
  { name: 'raw length in spacing arbitrary value', only: TS,
    re: new RegExp(`(?<![\\w-])${VARIANTS}-?${SPACE_UTIL}-\\[[^\\]]*${RAW_LENGTH}[^\\]]*\\]`, 'g') },
  { name: 'raw spacing in style object', only: TS,
    re: new RegExp(`\\b${SPACE_KEY}\\s*:\\s*(?:-?[1-9]\\d*(?:\\.\\d+)?\\b|['"\`][^'"\`]*${RAW_LENGTH})`, 'g') },
  { name: 'raw spacing in CSS', only: CSS,
    re: new RegExp(`(?<![\\w-])${SPACE_PROP}\\s*:[^;{}]*${RAW_LENGTH}`, 'g') },
]

const hits = []
for (const f of files) {
  const rel = relative(root, f)
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line) || /allow-(raw|hex)/.test(line)) return
    for (const r of rules) {
      if (r.only && !r.only.test(f)) continue
      for (const m of line.matchAll(r.re)) hits.push(`${rel}:${i + 1}: ${r.name}: ${m[0]}`)
    }
  })
}

if (hits.length) {
  console.log(hits.join('\n'))
  console.log(`\nToken lint: FAIL (${hits.length}). Use a token: a CSS variable such as var(--space-3) or var(--color-fg), or its Tailwind key.`)
  process.exit(1)
}
console.log(`Token lint: PASS (${files.length} files)`)
