import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

// Crawlers are allowed on purpose, and each one is named so the choice is visible: search engines,
// AI answer crawlers (they fetch a page to answer a question) and AI training crawlers. Every other
// crawler falls under the wildcard with the same rules. API routes and admin stay out for all.
const SEARCH = ['Googlebot', 'Bingbot', 'Yeti', 'Daumoa', 'DuckDuckBot', 'Applebot', 'YandexBot']
const AI_ANSWER = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User']
const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Meta-ExternalAgent', 'Amazonbot']
const DISALLOW = ['/api/', '/admin/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: SEARCH, allow: '/', disallow: DISALLOW },
      { userAgent: AI_ANSWER, allow: '/', disallow: DISALLOW },
      { userAgent: AI_TRAINING, allow: '/', disallow: DISALLOW },
      { userAgent: '*', allow: '/', disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
