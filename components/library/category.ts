// One colour field and one glyph per Explore category. The colour is a CSS variable (the same in
// both themes, always with black ink); the glyph is drawn by <Glyph>.
import type { GlyphName } from './Glyph'

export type CategoryKey = 'pop' | 'drama' | 'beauty' | 'culture' | 'food'

export interface CategoryStyle {
  key: CategoryKey
  /** CSS colour of the field: var(--category-*) */
  color: string
  glyph: GlyphName
}

const STYLES: Record<CategoryKey, CategoryStyle> = {
  pop: { key: 'pop', color: 'var(--category-pop)', glyph: 'spark' },
  drama: { key: 'drama', color: 'var(--category-drama)', glyph: 'ring' },
  beauty: { key: 'beauty', color: 'var(--category-beauty)', glyph: 'flower' },
  culture: { key: 'culture', color: 'var(--category-culture)', glyph: 'arch' },
  food: { key: 'food', color: 'var(--category-food)', glyph: 'bowl' },
}

/** Style for a category slug ('k-pop'), key ('pop') or label-like value ('K-Pop', 'kpop'); null when
 * the value names no category. */
export function categoryStyle(value: string | null | undefined): CategoryStyle | null {
  if (!value) return null
  const k = value.toLowerCase().replace(/^k[-_\s]?/, '') as CategoryKey
  return STYLES[k] ?? null
}

/** The data-category attribute value for a card or marker, or undefined when it has none. */
export function categoryAttr(value: string | null | undefined): CategoryKey | undefined {
  return categoryStyle(value)?.key
}
