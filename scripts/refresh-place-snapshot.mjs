#!/usr/bin/env node
// Refreshes lib/place-snapshot.json: the name, area and photo of every place the Explore themed
// rows and the Michelin noodles page show, read once from the BFF so the site makes no place
// reads at runtime (each themed row used to read every place on a cold cache and trip the BFF's
// guest limit).
//
//   npm run places:snapshot      (needs API_URL in the environment or .env.local)
//
// Places: every DB id in lib/db-poi-mapping.ts, plus the places of each collection read from
// /context/entity:<id> in lib/kfood-michelin-noodles.ts. One read every 5 s; it stops on the first
// 429 and leaves the old file as it was. Run it again after the seed lists or the places change.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'lib/place-snapshot.json')
const GAP_MS = 5000

function apiUrl() {
  if (process.env.API_URL) return process.env.API_URL
  try {
    const line = readFileSync(join(root, '.env.local'), 'utf8').split('\n').find((l) => l.startsWith('API_URL='))
    if (line) return line.slice('API_URL='.length).replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '')
  } catch {}
  throw new Error('API_URL is not set (environment or .env.local)')
}
const BFF_URL = apiUrl()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let calls = 0
async function get(path) {
  if (calls++) await sleep(GAP_MS)
  const res = await fetch(`${BFF_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000) })
  if (res.status === 429) {
    console.error(`429 on read ${calls}: stopped, ${OUT} left as it was`)
    process.exit(2)
  }
  if (!res.ok) {
    console.error(`\n${res.status} on read ${calls}`)
    return null
  }
  return res.json()
}

const mapping = readFileSync(join(root, 'lib/db-poi-mapping.ts'), 'utf8')
const ids = new Set([...mapping.matchAll(/^\s*'[^']+': (\d+),/gm)].map((m) => m[1]))
const noodles = readFileSync(join(root, 'lib/kfood-michelin-noodles.ts'), 'utf8')
const entities = [...noodles.matchAll(/entityId: (\d+) \}/g)].map((m) => m[1])
for (const entity of entities) {
  const context = await get(`/context/entity:${entity}?limit=50`)
  for (const c of context ?? []) ids.add(String(c.poi_id))
}

const places = {}
const missed = []
for (const id of [...ids].sort((a, b) => Number(a) - Number(b))) {
  const p = await get(`/places/${id}`)
  if (!p?.name_ko) {
    missed.push(id)
    continue
  }
  const names = Object.fromEntries(
    Object.entries(p.translations ?? {})
      .filter(([, t]) => t?.name)
      .map(([locale, t]) => [locale, t.name])
      .sort(([a], [b]) => a.localeCompare(b)),
  )
  places[id] = {
    name_ko: p.name_ko,
    names,
    primary_image_url: p.primary_image_url ?? null,
    display_region: p.display_region ?? null,
    display_district: p.display_district ?? null,
  }
  process.stdout.write(`\r${Object.keys(places).length + missed.length}/${ids.size}`)
}

if (!Object.keys(places).length) {
  console.error(`\nno place read: ${OUT} left as it was`)
  process.exit(1)
}
writeFileSync(OUT, `${JSON.stringify({ generated: new Date().toISOString().slice(0, 10), places }, null, 2)}\n`)
console.log(`\n${Object.keys(places).length} places written, ${missed.length} not read${missed.length ? ` (${missed.length} keep their typed values)` : ''}`)
