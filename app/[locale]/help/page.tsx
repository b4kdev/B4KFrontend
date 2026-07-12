'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { HelpCircle, ChevronDown, Mail, Copy, Check } from 'lucide-react'

const SECTIONS = ['getting-started', 'planning', 'saved', 'account', 'technical'] as const
type SectionSlug = (typeof SECTIONS)[number]
const ITEMS = ['q1', 'q2', 'q3'] as const

const LEGAL_LINKS = [
  { key: 'terms', href: '/legal/terms' },
  { key: 'privacy', href: '/legal/privacy' },
  { key: 'cookies', href: '/legal/cookies' },
] as const

export default function HelpPage() {
  const t = useTranslations('help')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  const toggle = (id: string) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  // L4 — anchor deep-link: matching category slug → scroll + auto-expand
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const slug = SECTIONS.find(s => s === hash)
    if (!slug) return
    setOpen(prev => {
      const next = { ...prev }
      for (const item of ITEMS) next[`${slug}-${item}`] = true
      return next
    })
    document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const email = t('sections.contact.emailAddress')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — mailto CTA remains the fallback */
    }
  }

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
        <h1 className="font-display font-black text-fg text-f-2xl">
          {t('title')}
        </h1>
      </div>

      <div className="flex flex-col gap-sp-6">
        {SECTIONS.map((slug: SectionSlug) => (
          <section key={slug} id={slug} className="scroll-mt-sp-6">
            <h2 className="text-f-sm font-semibold tracking-[0.07em] uppercase text-muted mb-sp-3">
              {t(`sections.${slug}.title`)}
            </h2>
            <div className="rounded-none overflow-hidden" style={{ border: '1px solid var(--bdr)' }}>
              {ITEMS.map((item, idx) => {
                const id = `${slug}-${item}`
                const isOpen = !!open[id]
                const isLast = idx === ITEMS.length - 1
                const question = t(`sections.${slug}.items.${item}.q`)
                return (
                  <div key={id} style={!isLast ? { borderBottom: 'var(--bdr)' } : {}}>
                    <button
                      id={`${id}-btn`}
                      aria-expanded={isOpen}
                      aria-controls={`${id}-panel`}
                      onClick={() => toggle(id)}
                      className="w-full flex items-center justify-between gap-sp-3 px-sp-4 py-sp-4 text-left min-h-touch hover:bg-muted-3 transition-colors"
                      aria-label={isOpen
                        ? t('collapseAriaLabel', { question })
                        : t('expandAriaLabel', { question })
                      }
                    >
                      <span className="text-f-md font-semibold text-fg leading-snug">
                        {question}
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
                        {t(`sections.${slug}.items.${item}.a`)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {/* Contact */}
        <div>
          <h2 className="text-f-sm font-semibold tracking-[0.07em] uppercase text-muted mb-sp-3">
            {t('sections.contact.title')}
          </h2>
          <div
            className="flex items-start gap-sp-4 p-sp-5 rounded-none"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <div
              className="w-10 h-10 rounded-none flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-3)' }}
            >
              <Mail size={18} strokeWidth={2} className="text-lav" />
            </div>
            <div className="min-w-0">
              <p className="text-f-md text-muted mb-sp-3">{t('sections.contact.desc')}</p>
              <div className="flex flex-wrap items-center gap-sp-2">
                <a
                  href={t('sections.contact.ctaEmailHref')}
                  className="inline-flex items-center gap-sp-2 px-sp-4 py-sp-2 rounded-none text-f-md font-semibold text-lav min-h-touch hover:text-fg transition-colors"
                  style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
                >
                  <Mail size={14} strokeWidth={2} />
                  {t('sections.contact.ctaEmail')}
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={t('sections.contact.copyEmailAriaLabel')}
                  className="inline-flex items-center gap-sp-2 px-sp-4 py-sp-2 rounded-none text-f-md font-semibold text-muted min-h-touch hover:text-fg transition-colors"
                  style={{ border: '1px solid var(--bdr)' }}
                >
                  {copied
                    ? <Check size={14} strokeWidth={2} className="text-success" aria-hidden />
                    : <Copy size={14} strokeWidth={2} aria-hidden />
                  }
                  {copied ? t('sections.contact.copyEmailCopied') : t('sections.contact.copyEmail')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <footer>
          <h2 className="text-f-sm font-semibold tracking-[0.07em] uppercase text-muted mb-sp-3">
            {t('legal.title')}
          </h2>
          <nav className="flex flex-wrap items-center gap-x-sp-6 gap-y-sp-2" aria-label={t('legal.title')}>
            {LEGAL_LINKS.map(link => (
              <Link
                key={link.key}
                href={link.href}
                className="inline-flex items-center text-f-md text-muted min-h-touch hover:text-fg transition-colors"
              >
                {t(`legal.${link.key}`)}
              </Link>
            ))}
          </nav>
        </footer>
      </div>
    </main>
  )
}
