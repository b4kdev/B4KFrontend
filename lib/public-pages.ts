import type { MetadataRoute } from 'next'
import { GAMIFICATION } from '@/lib/features'

// The public pages listed for search engines and AI crawlers: app/sitemap.ts and the llms.txt files
// (lib/llms.ts) read the same list, so both change together.
export const PUBLIC_PAGES: Array<{
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
  { path: '/explore/k-food',     changeFrequency: 'daily',   priority: 0.8 },
  { path: '/explore/k-culture',  changeFrequency: 'daily',   priority: 0.8 },
  ...(GAMIFICATION ? [
    { path: '/leaderboard',      changeFrequency: 'daily' as const,  priority: 0.5 },
    { path: '/badges',           changeFrequency: 'weekly' as const, priority: 0.4 },
  ] : []),
  { path: '/help',                changeFrequency: 'monthly', priority: 0.3 },
  { path: '/legal/terms',        changeFrequency: 'yearly',  priority: 0.2 },
  { path: '/legal/privacy',      changeFrequency: 'yearly',  priority: 0.2 },
  { path: '/legal/cookies',      changeFrequency: 'yearly',  priority: 0.2 },
]
