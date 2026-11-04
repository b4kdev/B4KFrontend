import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'
import { placeFileCount } from '@/lib/sitemap-data'

// Crawlers are allowed on purpose, and each one is named so the choice is visible: search engines,
// AI answer crawlers (they fetch a page to answer a question) and AI training crawlers. Every other
// crawler falls under the wildcard with the same rules. API routes and admin stay out for all.
const SEARCH = ['Googlebot', 'Bingbot', 'Yeti', 'Daumoa', 'DuckDuckBot', 'Applebot', 'YandexBot']
const AI_ANSWER = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User']
const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Meta-ExternalAgent', 'Amazonbot']
const DISALLOW = ['/api/', '/admin/']

// The main sitemap and one file per PLACES_PER_FILE places (app/sitemaps), counted once a day.
export const revalidate = 86400

export default async function robots(): Promise<MetadataRoute.Robots> {
  const placeFiles = await placeFileCount()
  return {
    rules: [
      { userAgent: SEARCH, allow: '/', disallow: DISALLOW },
      { userAgent: AI_ANSWER, allow: '/', disallow: DISALLOW },
      { userAgent: AI_TRAINING, allow: '/', disallow: DISALLOW },
      { userAgent: '*', allow: '/', disallow: DISALLOW },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, ...Array.from({ length: placeFiles }, (_, i) => `${SITE_URL}/sitemaps/places-${i + 1}.xml`)],
  }
}
