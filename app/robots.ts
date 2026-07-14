import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

// SC-28 (F-DGWQGW) — default-allow. No AI-crawler blocking rules on purpose:
// GEO/AEO strategy wants LLM crawlers (GPTBot, ClaudeBot, etc.) indexing us.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
