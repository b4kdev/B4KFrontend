export interface TranslatableEntity {
  name_ko: string
  name_en?: string | null
  translations?: Record<string, { name?: string; description?: string }>
}

/** entity_translations에는 ko가 없다(ko는 core.entities.canonical_name이 원본) — name만 채워진다. */
export function pickEntityTitle(e: TranslatableEntity, locale: string): string {
  if (locale === 'ko') return e.name_ko
  const t = e.translations ?? {}
  return t[locale]?.name ?? t['en']?.name ?? e.name_en ?? e.name_ko
}
