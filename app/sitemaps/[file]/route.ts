import { routing } from '@/i18n/routing'
import { hreflangAlternates, localizedUrl } from '@/lib/site-url'
import { PLACES_PER_FILE, sitemapList } from '@/lib/sitemap-data'

// Place pages, in files of PLACES_PER_FILE places: /sitemaps/places-1.xml, places-2.xml, …
// (listed in robots.txt). Each place has one URL per language with its language alternates.
export const revalidate = 86400

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function GET(_req: Request, props: { params: Promise<{ file: string }> }) {
  const { file } = await props.params
  const n = Number(/^places-(\d{1,3})\.xml$/.exec(file)?.[1])
  if (!n) return new Response('Not found', { status: 404 })
  let list
  try {
    list = await sitemapList('places', PLACES_PER_FILE, (n - 1) * PLACES_PER_FILE)
  } catch {
    return new Response('Upstream error', { status: 502 })
  }
  if (!list.items.length) return new Response('Not found', { status: 404 })
  const urls = list.items.flatMap(({ id, updated_at }) => {
    const path = `/place/${id}`
    const links = Object.entries(hreflangAlternates(path)).map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${esc(href)}"/>`).join('')
    return routing.locales.map((locale) =>
      `<url><loc>${esc(localizedUrl(locale, path))}</loc>${updated_at ? `<lastmod>${updated_at}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.5</priority>${links}</url>`)
  })
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
