'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { HelpCircle, ChevronDown, Mail } from 'lucide-react'

type SectionKey = 'gettingStarted' | 'map' | 'account'

const SECTIONS: { key: SectionKey; items: string[] }[] = [
  { key: 'gettingStarted', items: ['q1', 'q2', 'q3'] },
  { key: 'map',            items: ['q1', 'q2'] },
  { key: 'account',        items: ['q1', 'q2'] },
]

export default function HelpPage() {
  const t = useTranslations('help')
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <main
      className="max-w-[720px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('ariaLabel')}
    >
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>

      <div className="flex items-center gap-sp-3 mb-sp-8">
        <HelpCircle size={22} strokeWidth={2} className="text-lav shrink-0" />
        <h1 className="font-display font-black text-fg text-[clamp(22px,2.5vw,32px)]">
          {t('title')}
        </h1>
      </div>

      <div className="flex flex-col gap-sp-6">
        {SECTIONS.map(section => (
          <div key={section.key}>
            <h2 className="text-f-sm font-semibold tracking-[0.07em] uppercase text-muted mb-sp-3">
              {t(`sections.${section.key}.title`)}
            </h2>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--bdr)' }}>
              {section.items.map((item, idx) => {
                const id = `${section.key}-${item}`
                const isOpen = !!open[id]
                const isLast = idx === section.items.length - 1
                return (
                  <div key={id} style={!isLast ? { borderBottom: 'var(--bdr)' } : {}}>
                    <button
                      id={`${id}-btn`}
                      aria-expanded={isOpen}
                      aria-controls={`${id}-panel`}
                      onClick={() => toggle(id)}
                      className="w-full flex items-center justify-between gap-sp-3 px-sp-4 py-sp-4 text-left min-h-touch hover:bg-muted-3 transition-colors"
                      aria-label={isOpen
                        ? t('collapseAriaLabel', { question: t(`sections.${section.key}.items.${item}.q`) })
                        : t('expandAriaLabel',   { question: t(`sections.${section.key}.items.${item}.q`) })
                      }
                    >
                      <span className="text-f-md font-semibold text-fg leading-snug">
                        {t(`sections.${section.key}.items.${item}.q`)}
                      </span>
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        className={['text-muted shrink-0 transition-transform', isOpen ? 'rotate-180' : ''].join(' ')}
                        aria-hidden
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={`${id}-panel`}
                        role="region"
                        aria-labelledby={`${id}-btn`}
                        className="px-sp-4 pb-sp-4 text-f-md text-muted leading-relaxed"
                        style={{ borderTop: 'var(--bdr)' }}
                      >
                        {t(`sections.${section.key}.items.${item}.a`)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Contact */}
        <div>
          <h2 className="text-f-sm font-semibold tracking-[0.07em] uppercase text-muted mb-sp-3">
            {t('sections.contact.title')}
          </h2>
          <div
            className="flex items-start gap-sp-4 p-sp-5 rounded-lg"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-3)' }}
            >
              <Mail size={18} strokeWidth={2} className="text-lav" />
            </div>
            <div>
              <p className="text-f-md text-muted mb-sp-3">{t('sections.contact.desc')}</p>
              <a
                href={t('sections.contact.ctaEmailHref')}
                className="inline-flex items-center gap-sp-2 px-sp-4 py-sp-2 rounded-lg text-f-md font-semibold text-lav min-h-touch hover:text-fg transition-colors"
                style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
              >
                <Mail size={14} strokeWidth={2} />
                {t('sections.contact.ctaEmail')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
