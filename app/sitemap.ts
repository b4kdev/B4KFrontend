import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { SITE_URL, hreflangAlternates } from '@/lib/site-url'
import { sitemapList } from '@/lib/sitemap-data'
import { PUBLIC_PAGES as STATIC_PATHS } from '@/lib/public-pages'

// Home, Explore hubs, static public pages, and public plans (BFF GET /sitemap/plans). Excludes
// /profile/*, /notifications, drafts and anything requiring auth. Place pages are too many for one
// file: they are in /sitemaps/places-N.xml (app/sitemaps), listed in robots.txt.
export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const { path, changeFrequency, priority } of STATIC_PATHS) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: hreflangAlternates(path) },
      })
    }
  }

  // A failed list leaves the plans out of this version; the static pages still go out.
  const plans = await sitemapList('plans', 10000).catch(() => ({ total: 0, items: [] }))
  for (const plan of plans.items) {
    const path = `/plan/${plan.id}`
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: plan.updated_at ? new Date(plan.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: hreflangAlternates(path) },
      })
    }
  }

  return entries
}
