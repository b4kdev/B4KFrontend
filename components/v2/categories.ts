// Explore categories and row names shared by the screens and the page metadata (server and client).

/** The five categories in the drawn order: Copy Deck label and subline, card photo. */
export const CATEGORIES = [
  { slug: 'k-pop', label: 'CD0433', sub: 'CD1550', image: '/images/home/editorial/KP-008_world-kpop-center-hybe-insight.webp' },
  { slug: 'k-drama', label: 'CD0431', sub: 'CD1551', image: '/images/home/new/KD010-009_hakrim-dabang.webp' },
  { slug: 'k-beauty', label: 'CD0427', sub: 'CD1552', image: '/images/home/editorial/KB-NEW-065_olive-young-myeongdong.webp' },
  { slug: 'k-culture', label: 'CD0429', sub: 'CD1553', image: '/images/home/editorial/KD016-014_gyeongbokgung-palace.webp' },
  { slug: 'k-food', label: 'CD0251', sub: 'CD1554', image: '/mock-images/kbbq.png' },
] as const

/** Rows whose name is its own Copy Deck row; other rows read explore.sections.<row> (messages/v2/keys.json). */
export const ROW_LABEL: Record<string, Record<string, string>> = {
  'k-pop': { concerts: 'CD1556', merchandise: 'CD1557' },
}

type Text = (id: string, values?: Record<string, string>) => string

/** A row's name: Trending is one template for every category ("Trending in K-Drama"); `t` reads a
 * Copy Deck id, `k` a live message key through its deck row. */
export function rowName(category: string, row: string, t: Text, k: Text): string {
  const name = CATEGORIES.find((c) => c.slug === category)?.label
  if (row === 'trending' && name) return t('CD1555', { category: t(name) })
  return ROW_LABEL[category]?.[row] ? t(ROW_LABEL[category][row]) : k(`explore.sections.${row}`)
}
