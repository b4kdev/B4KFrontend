'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Footer, SearchPill, TopAppBar } from '@/components/library'
import { cn } from '@/lib/cn'
import { useCd } from './cd'
import { useV2Shell } from './V2Shell'

// Content page template: phone Top app bar (Home type with Menu and search, or Page type
// with Back and a title), the main landmark, centered content up to 1280, Footer.

export type V2PageProps = {
  /**
   * Phone top bar: Home (menu + search) or Page (back + title). Every page has one h1: by default the
   * Page bar's title on phones; h1 'page' = the page shows its own h1 at every width, so the title is
   * plain text; h1 'always' = the page has none of its own, so desktop gets the title as a hidden h1.
   */
  bar?: { type: 'home' } | { type: 'page'; title: string; action?: ReactNode; h1?: 'page' | 'always' } | { type: 'none' }
  /** Full width (no 1280 container), e.g. Home with its hero. */
  bleed?: boolean
  /** Hide the footer (flows); 'phone' hides it on phones only (sign-in pages). */
  noFooter?: boolean | 'phone'
  /** Phones: the first block starts under the floating Home bar (a full-width hero), no spacer. */
  underBar?: boolean
  children: ReactNode
  className?: string
}

export function V2Page({ bar = { type: 'home' }, bleed, noFooter, underBar, children, className }: V2PageProps) {
  const router = useRouter()
  const { labels, openDrawer, navOverlays } = useV2Shell()
  return (
    <>
      {bar.type === 'home' ? (
        <TopAppBar type="home" labels={labels} onMenu={openDrawer} search={<SearchPill label={labels.search} href="/search" />} className="fixed inset-x-0 top-0 z-30 lg:hidden" />
      ) : bar.type === 'page' ? (
        <TopAppBar type="page" labels={labels} onBack={() => router.back()} title={bar.title} titleAs={bar.h1 === 'page' ? 'p' : 'h1'} action={bar.action} className="sticky top-0 z-30 lg:hidden" />
      ) : null}
      {/* The floating Home bar sits over the page: the first block starts below it on phones. */}
      {bar.type === 'home' && !underBar ? <div aria-hidden className="h-[calc(var(--fab-size)+env(safe-area-inset-top))] shrink-0 lg:hidden" /> : null}
      <main id="main" tabIndex={-1} className={cn('flex-1 outline-none', !bleed && 'mx-auto w-full max-w-[calc(var(--container-xl)+var(--space-8)*2)] px-[var(--grid-gutter-mobile)] py-[var(--space-6)] md:px-[var(--grid-gutter-tablet)] lg:px-[var(--space-8)]', className)}>
        {bar.type === 'page' && bar.h1 === 'always' ? <h1 className="sr-only max-lg:hidden">{bar.title}</h1> : null}
        {children}
      </main>
      {noFooter === true ? null : <V2Footer className={noFooter === 'phone' ? 'max-lg:hidden' : undefined} />}
      {/* A page on a map address (error, not found) ends above the floating Navigation bar, as drawn. */}
      {navOverlays ? <div aria-hidden className="h-[calc(var(--fab-size)+env(safe-area-inset-bottom))] shrink-0 lg:hidden" /> : null}
    </>
  )
}

/** The page Footer (About B4K, Help, Terms, Privacy Policy, Cookies). */
export function V2Footer({ className }: { className?: string }) {
  const t = useCd()
  return (
    <Footer
      className={className}
      navLabel={t('CD0809')}
      copyright={t('CD1462')}
      links={[
        { label: t('CD1173'), href: '/about' },
        { label: t('CD0320'), href: '/help' },
        { label: t('CD1460'), href: '/legal/terms' },
        { label: t('CD0321'), href: '/legal/privacy', strong: true },
        { label: t('CD1461'), href: '/legal/cookies' },
      ]}
    />
  )
}
