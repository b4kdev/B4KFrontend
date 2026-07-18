'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ExploreHeroSlide } from '@/app/api/explore/[category]/route'

export default function ExploreHero({ slides }: { slides: ExploreHeroSlide[] }) {
  const t = useTranslations('explore')
  const [idx, setIdx] = useState(0)
  const [prefersReduced, setPrefersReduced] = useState(false)
  const total = slides.length

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Auto-advance ~5s. Skipped when reduced motion is requested or <2 slides.
  useEffect(() => {
    if (prefersReduced || total < 2) return
    const timer = setInterval(() => setIdx((i) => (i + 1) % total), 5000)
    return () => clearInterval(timer)
  }, [total, prefersReduced])

  useEffect(() => {
    if (total > 0 && idx >= total) setIdx(0)
  }, [total, idx])

  if (total === 0) return null

  const prev = () => setIdx((i) => (i - 1 + total) % total)
  const next = () => setIdx((i) => (i + 1) % total)
  const slide = slides[Math.min(idx, total - 1)]

  return (
    <div
      className="relative overflow-hidden h-[240px] lg:h-[400px] bg-bg-2 mb-sp-8"
      aria-roledescription="carousel"
      aria-label={t('hero.ariaLabel')}
    >
      {/* Slide backgrounds — crossfade */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 bg-bg-3"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: prefersReduced ? 'none' : 'opacity var(--dur-reveal) var(--ease-linear)',
            backgroundImage: s.image_url ? `url(${s.image_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden
        />
      ))}
      {/* Scrim */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, var(--bg) 0%, transparent 100%)' }}
        aria-hidden
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-sp-6 lg:p-sp-10">
        <span className="inline-flex items-center bg-fg text-bg text-f-xxs font-extrabold tracking-[0.12em] uppercase px-sp-2 py-[4px] rounded-none mb-sp-3 w-fit">
          {slide.badge}
        </span>
        <h2 className="text-fg font-display text-f-display-feature tracking-[-0.02em] mb-sp-2 max-w-[520px]">
          {slide.title}
        </h2>
        <p className="hidden md:block text-f-md text-muted leading-relaxed mb-sp-4 max-w-[400px]">
          {slide.subtitle}
        </p>
        <Link
          href={slide.cta_href}
          className="cta-primary w-fit"
        >
          {slide.cta_label}
        </Link>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-sp-4 left-sp-6 lg:left-sp-10 flex gap-sp-1">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIdx(i)}
            aria-label={t('hero.slideN', { n: i + 1 })}
            aria-current={i === idx ? 'true' : undefined}
            className="h-[3px] rounded-full border-none cursor-pointer p-0 transition-all duration-300"
            style={{
              width: i === idx ? 28 : 16,
              background: i === idx ? 'var(--fg)' : 'var(--muted-2)',
            }}
          />
        ))}
      </div>

      {/* Arrows (desktop) */}
      {total > 1 && (
        <div className="hidden md:flex absolute bottom-sp-4 right-sp-6 gap-sp-2">
          {[
            { key: 'prev' as const, fn: prev, Icon: ChevronLeft },
            { key: 'next' as const, fn: next, Icon: ChevronRight },
          ].map(({ key, fn, Icon }) => (
            <button
              key={key}
              onClick={fn}
              aria-label={t(`hero.${key}`)}
              className="min-w-touch min-h-touch rounded-full flex items-center justify-center text-muted cursor-pointer transition-colors hover:text-fg"
              style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)' }}
            >
              <Icon size={14} strokeWidth={2} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
