import type { Metadata } from 'next'
import { createTranslator } from 'next-intl'
import { routing } from '@/i18n/routing'
import { localizedUrl, SITE_URL } from '@/lib/site-url'
import { PUBLIC_PAGES } from '@/lib/public-pages'
import { mergeCd } from '@/components/v2/messages'
import { helpMetadata, legalMetadata, LEGAL_DOCS, type LegalDoc } from '@/app/[locale]/_seo/page-metadata'
import { buildExploreMetadata, type ExploreCategory } from '@/app/[locale]/explore/_components/explore-seo'
import enV2 from '@/messages/v2/en.json'

// llms.txt (llmstxt.org) for one language: the site summary and the public pages of the sitemap
// (lib/public-pages.ts) with the titles and descriptions the pages give search engines, so the file
// changes whenever the sitemap or a page's texts change. /llms.txt is English, /<locale>/llms.txt
// the other languages.

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', ko: '한국어', ja: '日本語', 'zh-TW': '繁體中文', 'pt-BR': 'Português (BR)' }
const SITE_SUMMARY = 'Discover K-culture experiences across Korea'

export function llmsUrl(locale: string): string {
  return locale === routing.defaultLocale ? `${SITE_URL}/llms.txt` : `${SITE_URL}/${locale}/llms.txt`
}

async function deckTranslator(locale: string) {
  const load = (name: string): Promise<{ cd?: Record<string, string> }> =>
    import(`@/messages/v2/${name}.json`).then((m) => m.default).catch(() => ({}))
  const [deck, supplement] = await Promise.all([load(locale), load(`supplement/${locale}`)])
  return createTranslator({ locale, messages: { cd: mergeCd(enV2.cd, deck.cd, supplement.cd) }, namespace: 'cd' })
}

const text = (v: Metadata['title'] | Metadata['description']): string => (typeof v === 'string' ? v : '')

type Entry = { title: string; description: string; url: string }

async function entryFor(path: string, locale: string, label: (id: string) => string): Promise<Entry | null> {
  const url = localizedUrl(locale, path)
  if (path === '/map') return { title: label('CD0815'), description: '', url }
  if (path === '/explore') return { title: label('CD0804'), description: '', url }
  const category = /^\/explore\/(k-[a-z]+)$/.exec(path)?.[1]
  if (category) {
    const m = await buildExploreMetadata(category as ExploreCategory, locale)
    return { title: text(m.title), description: text(m.description), url }
  }
  if (path === '/help') {
    const m = await helpMetadata(locale)
    return { title: text(m.title), description: text(m.description), url }
  }
  const doc = /^\/legal\/([a-z]+)$/.exec(path)?.[1]
  if (doc && (LEGAL_DOCS as readonly string[]).includes(doc)) {
    const m = await legalMetadata(doc as LegalDoc, locale)
    return { title: text(m.title), description: text(m.description), url }
  }
  // Pages without a title of their own here (the gamification pages, off at launch) are left out.
  return null
}

const line = (e: Entry) => `- [${e.title}](${e.url})${e.description ? `: ${e.description}` : ''}`

export async function buildLlmsTxt(locale: string): Promise<string> {
  const label = await deckTranslator(locale)
  const sections: { heading: string; match: (path: string) => boolean; entries: Entry[] }[] = [
    { heading: label('CD0815'), match: (p) => p === '/map', entries: [] },
    { heading: label('CD0804'), match: (p) => p.startsWith('/explore'), entries: [] },
    { heading: label('CD0806'), match: (p) => p === '/help' || p.startsWith('/legal/'), entries: [] },
  ]
  for (const { path } of PUBLIC_PAGES) {
    const section = sections.find((s) => s.match(path))
    if (!section) continue
    const entry = await entryFor(path, locale, label)
    if (entry) section.entries.push(entry)
  }
  const others = routing.locales.filter((l) => l !== locale).map((l) => `- [${LANGUAGE_NAMES[l] ?? l}](${llmsUrl(l)})`)
  return [
    '# B4K',
    '',
    `> ${SITE_SUMMARY}`,
    '',
    `- [B4K](${localizedUrl(locale, '')})`,
    ...sections.filter((s) => s.entries.length).flatMap((s) => ['', `## ${s.heading}`, '', ...s.entries.map(line)]),
    '',
    `## ${label('CD0808')}`,
    '',
    ...others,
    '',
  ].join('\n')
}

export function llmsResponse(body: string): Response {
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
