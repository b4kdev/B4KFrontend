'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Globe } from 'lucide-react'
import { DropdownMenu, IconButton, MenuGroup, MenuItem, Modal, ROW_DIVIDER, Tooltip } from '@/components/library'
import { cn } from '@/lib/cn'
import { FOCUS_RING_INSET } from '@/components/library/styles'
import { useCd } from './cd'

// Language picker: the five languages in their own script, each with its lang
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
      {/* Figma: the list sits 8 from the header and the sheet edges, each item 16 inside (the body pads 24). */}
      <div role="menu" aria-label={t('CD0808')} className="-mx-[var(--space-4)] -mt-[var(--space-4)] [&>*]:px-[var(--space-4)]">
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

/** The five languages under a Language label (Dropdown menu Select type). */
function LanguageItems() {
  const t = useCd()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  return (
    <MenuGroup label={t('CD0808')}>
      {LANGUAGES.map((l) => (
        <MenuItem key={l.code} checked={l.code === locale} onClick={() => router.replace(pathname, { locale: l.code })}>
          <span lang={l.code}>{l.name}</span>
        </MenuItem>
      ))}
    </MenuGroup>
  )
}

/** Desktop Settings Language row: the row opens the language menu under its value. */
export function LanguageRowMenu({ title }: { title: string }) {
  const t = useCd()
  const locale = useLocale()
  const name = LANGUAGES.find((l) => l.code === locale)?.name ?? locale
  return (
    <li className={ROW_DIVIDER}>
      <DropdownMenu label={t('CD0808')} align="end" rootClassName="flex w-full" trigger={
        <button type="button" className={cn('flex min-h-[var(--target-touch-min)] w-full items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-left hover:bg-ui-state-hover', FOCUS_RING_INSET)}>
          <span className="flex-1 truncate type-body-base text-ui-fg">{title}</span>
          <span lang={locale} className="shrink-0 type-body-base text-ui-fg-muted">{name}</span>
        </button>
      }>
        <LanguageItems />
      </DropdownMenu>
    </li>
  )
}

/** Desktop Header language menu: the five languages under a Language label. */
export function LanguageMenu() {
  const t = useCd()
  return (
    <Tooltip text={t('CD0808')}>
      <DropdownMenu label={t('CD0808')} align="end" trigger={<IconButton label={t('CD0808')} icon={<Globe />} />}>
        <LanguageItems />
      </DropdownMenu>
    </Tooltip>
  )
}
