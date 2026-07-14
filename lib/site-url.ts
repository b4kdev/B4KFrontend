import { routing } from '@/i18n/routing'

// SC-28 — single source of truth for absolute URLs (sitemap, robots, OG tags,
// JSON-LD). Falls back to prod domain so dev/preview builds still emit valid
// (if inaccurate) metadata rather than throwing.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://b4k.app').replace(/\/$/, '')

export function localizedUrl(locale: string, path: string = ''): string {
  return `${SITE_URL}/${locale}${path}`
}

/** hreflang alternates map for every supported locale + x-default, for one path. */
export function hreflangAlternates(path: string = ''): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of routing.locales) {
    languages[locale] = localizedUrl(locale, path)
  }
  languages['x-default'] = localizedUrl(routing.defaultLocale, path)
  return languages
}
