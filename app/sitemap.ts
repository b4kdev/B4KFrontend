import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { SITE_URL, hreflangAlternates } from '@/lib/site-url'
import { MOCK_PLANS } from '@/lib/mock/plans-list'

// SC-28 (F-DGWQGW) — Home, Explore hubs, static public pages, and published
// plans. Excludes /profile/*, /notifications, drafts, /plan/preview (never
// built — see CLAUDE.md §9), and anything requiring auth.
//
// NOTE: individual POI pages are NOT listed here yet. The canonical detail
// route (/place/[poiId], BLK-11) exists and is indexable, but listing every
// POI needs a "list all is_publishable=TRUE POIs" BFF capability that isn't
// confirmed to exist yet — flagged to dev friend, not guessed at. See BLK-11.
const STATIC_PATHS: Array<{
  path: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
}> = [
  { path: '',                    changeFrequency: 'daily',   priority: 1.0 },
  { path: '/map',                changeFrequency: 'daily',   priority: 0.9 },
  { path: '/explore',            changeFrequency: 'daily',   priority: 0.9 },
  { path: '/explore/k-pop',      changeFrequency: 'daily',   priority: 0.8 },
  { path: '/explore/k-drama',    changeFrequency: 'daily',   priority: 0.8 },
  { path: '/explore/k-beauty',   changeFrequency: 'daily',   priority: 0.8 },
  { path: '/explore/k-culture',  changeFrequency: 'daily',   priority: 0.8 },
  { path: '/leaderboard',        changeFrequency: 'daily',   priority: 0.5 },
  { path: '/badges',             changeFrequency: 'weekly',  priority: 0.4 },
  { path: '/help',                changeFrequency: 'monthly', priority: 0.3 },
  { path: '/sitemap',            changeFrequency: 'monthly', priority: 0.2 },
  { path: '/legal/terms',        changeFrequency: 'yearly',  priority: 0.2 },
  { path: '/legal/privacy',      changeFrequency: 'yearly',  priority: 0.2 },
  { path: '/legal/cookies',      changeFrequency: 'yearly',  priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
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

  for (const plan of MOCK_PLANS) {
    if (!plan.is_published) continue
    const path = `/plan/${plan.id}`
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(plan.created_at),
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: hreflangAlternates(path) },
      })
    }
  }

  return entries
}
