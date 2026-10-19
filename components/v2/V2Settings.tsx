'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { MenuItem, Modal } from '@/components/library'
import { useCd } from './cd'

// Language picker (SCR-034, PD-06): the five languages in their own script, each with its lang
// attribute (WCAG 3.1.2); a choice applies on tap. Modal on desktop, sheet on phones.

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
] as const

export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useCd()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  return (
    <Modal open={open} onClose={onClose} title={t('CD0808')} closeLabel={t('CD0758')} size="sm">
      <div role="menu" aria-label={t('CD0808')} className="-mx-[var(--space-6)]">
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
