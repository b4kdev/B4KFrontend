'use client'

import { Link as IntlLink } from '@/i18n/navigation'
import { useCd } from '../cd'

/** Map controls on the right sit 16 above the legal line's top (one line of type-body-legal). */
export const ABOVE_LEGAL_LINE = 'bottom-[calc(var(--space-8)+var(--font-size-2xs)*var(--leading-normal))]'

/** Desktop map legal line (Legal line Placement=map): after Naver's own logo, 16 from the bottom. */
export function MapLegalLine() {
  const t = useCd()
  return (
    <p className="absolute bottom-[var(--space-4)] left-[var(--space-16)] flex flex-wrap items-center gap-x-[var(--space-3)] type-body-legal text-ui-fg-muted">
      <span>{t('CD1462')}</span>
      <IntlLink href="/legal/terms" className="hover:text-ui-fg hover:underline">{t('CD1460')}</IntlLink>
      <IntlLink href="/legal/privacy" className="type-body-legal-strong hover:text-ui-fg hover:underline">{t('CD0321')}</IntlLink>
    </p>
  )
}
