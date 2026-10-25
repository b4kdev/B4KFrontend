import type { Metadata } from 'next'
import { createTranslator } from 'next-intl'
import { mergeCd } from '@/components/v2/messages'
import enV2 from '@/messages/v2/en.json'
import keys from '@/messages/v2/keys.json'
import { routing } from '@/i18n/routing'
import { hreflangAlternates, localizedUrl } from '@/lib/site-url'

// Page titles and descriptions from the Copy Deck templates: the brand goes last after " | ",
// a title is 30 to 60 characters and a description 70 to 155; a value that is missing drops its
// part (the next shorter template), and a title over 60 falls back to the next one as well.

export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 155

type Values = Record<string, string | number>
export type SeoText = { t: (id: string, values?: Values) => string; k: (key: string, values?: Values) => string }

const KEY_TO_CD = keys as Record<string, string>

/** The Copy Deck texts of a locale on the server (as the screens read them): t('CD0800'), k('help.title'). */
export async function seoText(locale: string): Promise<SeoText> {
  const load = (name: string): Promise<{ cd?: Record<string, string> }> =>
    import(`@/messages/v2/${name}.json`).then((m) => m.default).catch(() => ({}))
  const [deck, supplement] = await Promise.all([load(locale), load(`supplement/${locale}`)])
  // Plain texts: no word joiners in K-Pop and the like (those are for line breaks on screen).
  const cd = mergeCd(enV2.cd, deck.cd, supplement.cd)
  const tr = createTranslator({ locale, messages: { cd }, namespace: 'cd' })
  const t = (id: string, values?: Values) => tr(id as never, values as never) as string
  return { t, k: (key, values) => (KEY_TO_CD[key] ? t(KEY_TO_CD[key], values) : key) }
}

/** The first title that fits 60 characters (null entries are templates with a missing value);
 * the last one when none fits. */
export function fitTitle(...candidates: (string | null | undefined)[]): string {
  const ok = candidates.filter((c): c is string => !!c)
  return ok.find((c) => c.length <= TITLE_MAX) ?? ok[ok.length - 1] ?? 'B4K'
}

/** A description cut to 155 characters on a word boundary. */
export function fitDescription(text: string | null | undefined): string | undefined {
  const s = text?.replace(/\s+/g, ' ').trim()
  if (!s) return undefined
  if (s.length <= DESCRIPTION_MAX) return s
  const cut = s.slice(0, DESCRIPTION_MAX - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).replace(/[\s,;:·—-]+$/, '')}…`
}

/** A name cut to `max` characters on a word boundary (plan names in titles). */
export function cutName(name: string, max: number): string {
  if (name.length <= max) return name
  const cut = name.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ') > max / 2 ? cut.lastIndexOf(' ') : max).trimEnd()}…`
}

export const NOINDEX: Metadata['robots'] = { index: false, follow: true }

/** Title, description, canonical, hreflang and the share preview of one page. */
export function pageMeta({
  locale,
  path,
  title,
  description,
  type = 'website',
  robots,
  image,
}: {
  locale: string
  path: string
  title: string
  description?: string
  type?: 'website' | 'article'
  robots?: Metadata['robots']
  image?: string | null
}): Metadata {
  const url = localizedUrl(locale, path)
  // Pages without a photo of their own share the title card (app/api/og).
  const shareImage = image ?? `/api/og?locale=${encodeURIComponent(locale)}&title=${encodeURIComponent(title.replace(/\s*\|\s*B4K$/, ''))}`
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: url, languages: hreflangAlternates(path) },
    ...(robots ? { robots } : {}),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url,
      siteName: 'B4K',
      locale,
      alternateLocale: routing.locales.filter((l) => l !== locale),
      type,
      images: [{ url: shareImage, ...(image ? {} : { width: 1200, height: 630 }) }],
    },
    twitter: { card: 'summary_large_image', title, ...(description ? { description } : {}), images: [shareImage] },
  }
}

/** The generic title "{page} | B4K" for a page by its heading (cut on a word to fit 60), with
 * canonical and hreflang. */
export async function namedPageMeta(locale: string, path: string, page: string, opts: { description?: string; robots?: Metadata['robots']; type?: 'website' | 'article'; image?: string | null } = {}): Promise<Metadata> {
  const { t } = await seoText(locale)
  const room = TITLE_MAX - t('CD1832', { page: '' }).length
  return pageMeta({ locale, path, title: t('CD1832', { page: cutName(page, room) }), description: fitDescription(opts.description), robots: opts.robots, type: opts.type, image: opts.image })
}

/** The BFF's Korean region names in English (as hooks/useMapPois.ts REGION_API_NAME); Korean pages
 * keep the Korean name. */
const REGION_EN: Record<string, string> = {
  서울: 'Seoul', 부산: 'Busan', 제주: 'Jeju', 인천: 'Incheon', 대구: 'Daegu', 광주: 'Gwangju', 대전: 'Daejeon', 울산: 'Ulsan', 세종: 'Sejong',
  경기: 'Gyeonggi', 강원: 'Gangwon', 충북: 'Chungbuk', 충남: 'Chungnam', 전북: 'Jeonbuk', 전남: 'Jeonnam', 경북: 'Gyeongbuk', 경남: 'Gyeongnam',
}
export function regionName(region: string | null | undefined, locale: string): string | null {
  if (!region) return null
  return locale === 'ko' || !/[가-힣]/.test(region) ? region : REGION_EN[region] ?? null
}
