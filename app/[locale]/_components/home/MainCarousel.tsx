'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

const SLIDES = [
  { key: 'kCulture' },
  { key: 'boseong'  },
  { key: 'seoul'    },
] as const;

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
      className="relative rounded-[10px] overflow-hidden mb-11"
      style={{ aspectRatio: '2.6/1', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-roledescription="carousel"
      aria-label={tCarousel('ariaLabel')}
    >
      {/* Slide image placeholder (crossfade between slides) */}
      {SLIDES.map((s, i) => (
        <div
          key={s.key}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: prefersReduced ? 'none' : 'opacity 700ms ease',
          }}
          aria-hidden
        >
          <div className="flex flex-col items-center gap-2 opacity-20">
            <ImageIcon size={32} strokeWidth={2} className="text-fg" />
            <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-fg">
              Hero Image
            </span>
          </div>
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-9 md:p-11">
        <span className="inline-flex items-center bg-fg text-bg text-[9px] font-extrabold tracking-[0.12em] uppercase px-2.5 py-1 rounded-[2px] mb-3.5 w-fit">
          {t(`${slide.key}.badge`)}
        </span>
        <h1 className="text-fg font-display font-black text-[clamp(26px,3.5vw,48px)] leading-[1.05] tracking-[-0.02em] mb-3 whitespace-pre-line max-w-[520px]">
          {t(`${slide.key}.title`)}
        </h1>
        <p className="hidden md:block text-[13px] text-muted leading-relaxed mb-6 max-w-[400px]">
          {t(`${slide.key}.desc`)}
        </p>
        <button
          className="inline-flex items-center h-10 px-[22px] bg-fg text-bg text-[12px] font-semibold tracking-[0.02em] rounded font-body w-fit cursor-pointer border-none"
          onClick={() => {}}
        >
          {t(`${slide.key}.cta`)}
        </button>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-[18px] md:bottom-6 left-9 md:left-11 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={tCarousel('slideN', { n: i + 1 })}
            aria-current={i === idx ? 'true' : undefined}
            className="h-[3px] rounded-[2px] border-none cursor-pointer p-0 transition-all duration-300"
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
