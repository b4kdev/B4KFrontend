'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Footer, SearchPill, TopAppBar } from '@/components/library'
import { cn } from '@/lib/cn'
import { useCd } from './cd'
import { useV2Shell } from './V2Shell'

// Content page template (UI-86): phone Top app bar (Home type with Menu and search, or Page type
// with Back and a title), the main landmark, centered content up to 1280, Footer.

export type V2PageProps = {
  /** Phone top bar: Home (menu + search) or Page (back + title). */
  bar?: { type: 'home' } | { type: 'page'; title: string; action?: ReactNode } | { type: 'none' }
  /** Full width (no 1280 container), e.g. Home with its hero. */
  bleed?: boolean
  /** Hide the footer (flows). */
  noFooter?: boolean
  children: ReactNode
  className?: string
}

export function V2Page({ bar = { type: 'home' }, bleed, noFooter, children, className }: V2PageProps) {
  const t = useCd()
  const router = useRouter()
  const { labels, openDrawer } = useV2Shell()
  return (
    <>
      {bar.type === 'home' ? (
        <TopAppBar type="home" labels={labels} onMenu={openDrawer} search={<SearchPill label={labels.search} href="/search" />} className="sticky top-0 z-30 lg:hidden" />
      ) : bar.type === 'page' ? (
        <TopAppBar type="page" labels={labels} onBack={() => router.back()} title={bar.title} action={bar.action} className="sticky top-0 z-30 lg:hidden" />
      ) : null}
      <main id="main" tabIndex={-1} className={cn('flex-1 outline-none', !bleed && 'mx-auto w-full max-w-[var(--container-xl)] px-[var(--grid-gutter-mobile)] py-[var(--space-6)] md:px-[var(--grid-gutter-tablet)] lg:px-[var(--space-8)]', className)}>
        {children}
      </main>
      {noFooter ? null : (
        <Footer
          navLabel={t('CD0809')}
          copyright={t('CD1462')}
          links={[
            { label: t('CD0320'), href: '/help' },
            { label: t('CD1000'), href: '/legal/privacy' },
            { label: t('CD1460'), href: '/legal/terms' },
            { label: t('CD1461'), href: '/legal/cookies' },
          ]}
        />
      )}
    </>
  )
}
