'use client'

import { Link as IntlLink } from '@/i18n/navigation'
import { LegalLine } from '@/components/library'
import { useCd } from '../cd'

/** Map controls on the right sit 24 above the legal line's top (one line of type-body-legal plus its padding). */
export const ABOVE_LEGAL_LINE = 'bottom-[calc(var(--space-10)+var(--space-0-5)*2+var(--font-size-2xs)*var(--leading-normal))]'

/** Map legal line. Desktop (map): bottom right, 16 in from the corner, under the map controls (Naver's own
 * logo keeps the bottom left). Phones (list): the same links after the last place in the map sheet. */
export function MapLegalLine({ placement = 'map' }: { placement?: 'map' | 'list' }) {
  const t = useCd()
  return (
    <LegalLine
      className={placement === 'map' ? 'absolute bottom-[var(--space-4)] right-[var(--space-4)] rounded-sq-xs bg-map-ui-overlay px-[var(--space-2)] py-[var(--space-0-5)]' : 'pt-[var(--space-2)]'}
      lead={t('CD1462')}
      linkAs={IntlLink}
      links={[{ href: '/legal/terms', label: t('CD1460') }, { href: '/legal/privacy', label: t('CD0321'), strong: true }]}
    />
  )
}
