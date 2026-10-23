'use client'

import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { useCd } from '../cd'

/** Map controls on the right sit 16 above the legal line's top (one line of type-body-legal). */
export const ABOVE_LEGAL_LINE = 'bottom-[calc(var(--space-8)+var(--font-size-2xs)*var(--leading-normal))]'

/** Map legal line. Desktop (map): after Naver's own logo, 16 from the bottom. Phones (list): the same
 * links after the last place in the map sheet. */
export function MapLegalLine({ placement = 'map' }: { placement?: 'map' | 'list' }) {
  const t = useCd()
  return (
    <p className={cn('flex flex-wrap items-center gap-x-[var(--space-3)] type-body-legal text-ui-fg-muted', placement === 'map' ? 'absolute bottom-[var(--space-4)] left-[var(--space-16)]' : 'pt-[var(--space-2)]')}>
      <span>{t('CD1462')}</span>
      <IntlLink href="/legal/terms" className="hover:text-ui-fg hover:underline">{t('CD1460')}</IntlLink>
      <IntlLink href="/legal/privacy" className="type-body-legal-strong hover:text-ui-fg hover:underline">{t('CD0321')}</IntlLink>
    </p>
  )
}
