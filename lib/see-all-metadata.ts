import type { Metadata } from 'next'
import { rowName } from '@/components/v2/categories'
import { namedPageMeta, NOINDEX, seoText } from '@/lib/seo'

/** See all lists repeat their row's places: "{row} | B4K" with canonical and hreflang, crawled for
 * links and kept out of search results. `category` 'all' = the Home rows (Trending, Popular plans). */
export async function seeAllMetadata(locale: string, category: string, row: string): Promise<Metadata> {
  const { t, k } = await seoText(locale)
  const fromHome = category === 'all'
  const page = fromHome ? (row === 'trending' ? t('CD0313') : t('CD0477')) : rowName(category, row, t, k)
  return namedPageMeta(locale, fromHome ? `/explore/${row}` : `/explore/${category}/${row}`, page, { robots: NOINDEX })
}
