'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  { key: 'kCulture' as const, href: '/explore/k-culture' },
  { key: 'boseong'  as const, href: '/map' },
  { key: 'seoul'    as const, href: '/map' },
];

export default function MainCarousel() {
  const t = useTranslations('home.carousel.slides');
  const tCarousel = useTranslations('home.carousel');
  const [idx, setIdx] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const total = SLIDES.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(timer);
  }, [total, prefersReduced]);

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);
  const slide = SLIDES[idx];

  return (
    <div
      className="relative overflow-hidden h-[240px] lg:h-[560px]"
      style={{ background: 'var(--bg-2)' }}
      aria-roledescription="carousel"
      aria-label={tCarousel('ariaLabel')}
    >
      {/* Slide backgrounds — crossfade */}
      {SLIDES.map((s, i) => (
        <div
          key={s.key}
          className="absolute inset-0 bg-bg-3"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: prefersReduced ? 'none' : 'opacity 700ms ease',
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
      <div className="absolute inset-0 flex flex-col justify-end p-9 md:p-11">
        <span className="inline-flex items-center bg-fg text-bg text-f-xxs font-extrabold tracking-[0.12em] uppercase px-2.5 py-1 rounded-none mb-3.5 w-fit">
          {t(`${slide.key}.badge`)}
        </span>
        <h1 className="text-fg font-display font-black text-[clamp(26px,3.5vw,48px)] leading-[1.05] tracking-[-0.02em] mb-3 whitespace-pre-line max-w-[520px]">
          {t(`${slide.key}.title`)}
        </h1>
        <p className="hidden md:block text-f-md text-muted leading-relaxed mb-6 max-w-[400px]">
          {t(`${slide.key}.desc`)}
        </p>
        <Link
          href={slide.href}
          className="inline-flex items-center h-10 px-[22px] bg-fg text-bg text-f-sm font-semibold tracking-[0.02em] rounded-none font-body w-fit"
        >
          {t(`${slide.key}.cta`)}
        </Link>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-sp-4 md:bottom-6 left-9 md:left-11 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={tCarousel('slideN', { n: i + 1 })}
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
      <div className="hidden md:flex absolute bottom-5 right-6 gap-2">
        {[
          { key: 'prev', fn: prev, Icon: ChevronLeft },
          { key: 'next', fn: next, Icon: ChevronRight },
        ].map(({ key, fn, Icon }) => (
          <button
            key={key}
            onClick={fn}
            aria-label={tCarousel(key)}
            className="min-w-touch min-h-touch rounded-full flex items-center justify-center text-muted cursor-pointer transition-colors hover:text-fg"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)' }}
          >
            <Icon size={13} strokeWidth={2} />
          </button>
        ))}
      </div>
    </div>
  );
}
