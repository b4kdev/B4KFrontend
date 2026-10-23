'use client'

import { Link as IntlLink } from '@/i18n/navigation'
import { useCd } from '../cd'

/** Desktop map legal line (Legal line Placement=map): after Naver's own logo, 16 from the bottom. */
export function MapLegalLine() {
  const t = useCd()
  return (
    <p className="absolute bottom-[var(--space-4)] left-[var(--space-16)] flex flex-wrap items-center gap-x-[var(--space-3)] type-body-legal text-ui-fg-muted">
      <span>{t('CD1462')}</span>
      <IntlLink href="/legal/terms" className="hover:text-ui-fg hover:underline">{t('CD1460')}</IntlLink>
      <IntlLink href="/legal/privacy" className="type-body-legal-strong hover:text-ui-fg hover:underline">{t('CD0321')}</IntlLink>
      <IntlLink href="/about" className="hover:text-ui-fg hover:underline">{t('CD1173')}</IntlLink>
    </p>
  )
}
