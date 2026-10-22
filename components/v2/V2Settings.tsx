'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Globe } from 'lucide-react'
import { DropdownMenu, IconButton, MenuGroup, MenuItem, Modal, Tooltip } from '@/components/library'
import { useCd } from './cd'

// Language picker (SCR-034, PD-06): the five languages in their own script, each with its lang
// attribute (WCAG 3.1.2); a choice applies on tap. Desktop Header: a Dropdown menu under the globe;
// elsewhere a Modal (a sheet on phones).

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'pt-BR', name: 'Português (BR)' },
] as const

export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useCd()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  return (
    <Modal open={open} onClose={onClose} title={t('CD0808')} closeLabel={t('CD0758')} size="sm">
      <div role="menu" aria-label={t('CD0808')} className="-mx-[var(--space-6)] [&>*]:px-[var(--space-6)]">
        {LANGUAGES.map((l) => (
          <MenuItem
            key={l.code}
            checked={l.code === locale}
            onClick={() => {
              onClose()
              router.replace(pathname, { locale: l.code })
            }}
          >
            <span lang={l.code}>{l.name}</span>
          </MenuItem>
        ))}
      </div>
    </Modal>
  )
}

/** Desktop Header language menu: the five languages under a Language label. */
export function LanguageMenu() {
  const t = useCd()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  return (
    <Tooltip text={t('CD0808')}>
      <DropdownMenu label={t('CD0808')} align="end" trigger={<IconButton label={t('CD0808')} icon={<Globe />} />}>
        <MenuGroup label={t('CD0808')}>
          {LANGUAGES.map((l) => (
            <MenuItem key={l.code} checked={l.code === locale} onClick={() => router.replace(pathname, { locale: l.code })}>
              <span lang={l.code}>{l.name}</span>
            </MenuItem>
          ))}
        </MenuGroup>
      </DropdownMenu>
    </Tooltip>
  )
}
