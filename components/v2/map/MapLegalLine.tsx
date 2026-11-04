'use client'

import { Link as IntlLink } from '@/i18n/navigation'
import { LegalLine } from '@/components/library'
import { useCd } from '../cd'

/** Map controls on the right sit 16 above the legal line's top (one line of type-body-legal). */
export const ABOVE_LEGAL_LINE = 'bottom-[calc(var(--space-8)+var(--font-size-2xs)*var(--leading-normal))]'

/** Map legal line. Desktop (map): after Naver's own logo, 16 from the bottom, the text 62 from the map's
 * left edge (16 in, then the logo's drawn 34 and a 12 gap). Phones (list): the same
 * links after the last place in the map sheet. */
export function MapLegalLine({ placement = 'map' }: { placement?: 'map' | 'list' }) {
  const t = useCd()
  return (
    <LegalLine
      className={placement === 'map' ? 'absolute bottom-[var(--space-4)] left-[calc(var(--space-16)-var(--space-0-5))]' : 'pt-[var(--space-2)]'}
      lead={t('CD1462')}
      linkAs={IntlLink}
      links={[{ href: '/legal/terms', label: t('CD1460') }, { href: '/legal/privacy', label: t('CD0321'), strong: true }]}
    />
  )
}
