'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import FieldImage from '@/components/ui/FieldImage';
import type { HomeCarouselSlide } from '@/app/api/home/carousel/route';

function CarouselSkeleton() {
  return (
    <div
      className="relative overflow-hidden h-[240px] lg:h-[560px] animate-pulse bg-bg-2"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-bg-3" />
      <div className="absolute inset-0 flex flex-col justify-end p-9 md:p-11 gap-3">
        <div className="h-[18px] w-[110px] bg-muted-3" />
        <div className="h-[40px] w-3/5 bg-muted-3" />
        <div className="hidden md:block h-[14px] w-2/5 bg-muted-3" />
        <div className="h-10 w-[180px] bg-muted-3" />
      </div>
    </div>
  );
}

export default function MainCarousel() {
  const tCarousel = useTranslations('home.carousel');
  const { data, isLoading, error } = useSWR<HomeCarouselSlide[]>('/api/home/carousel', fetcher);

  const [idx, setIdx] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const total = data?.length ?? 0;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-advance ~5s. Skipped when reduced motion is requested or <2 slides.
  useEffect(() => {
    if (prefersReduced || total < 2) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(timer);
  }, [total, prefersReduced]);

  // Keep index in range if the slide array shrinks between fetches.
  useEffect(() => {
    if (total > 0 && idx >= total) setIdx(0);
  }, [total, idx]);

  if (isLoading) return <CarouselSkeleton />;
  // SPEC-01: every other section hides itself on fetch failure; Hero is the
  // one exception — its errors escalate to the page-level error boundary
  // (app/[locale]/error.tsx) instead of silently disappearing.
  if (error) throw error;
  // Genuinely empty (loaded, zero slides) is not an error — hide like any
  // other section, rest of the page still loads.
  if (!data || total === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);
  const slide = data[Math.min(idx, total - 1)];

  return (
    <div
      className="relative overflow-hidden h-[240px] lg:h-[560px] bg-bg-2"
      aria-roledescription="carousel"
      aria-label={tCarousel('ariaLabel')}
    >
      {/* Slide backgrounds — crossfade */}
      {data.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 bg-bg-3"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: prefersReduced ? 'none' : 'opacity var(--dur-reveal) ease',
          }}
          aria-hidden
        >
          {s.image_url && (
            <FieldImage
              src={s.image_url}
              alt=""
              fillContainer
              priority={i === 0}
            />
          )}
        </div>
      ))}
      {/* Scrim */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, var(--bg) 0%, transparent 100%)' }}
        aria-hidden
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-9 md:p-11">
        <span className="inline-flex items-center bg-fg text-bg text-f-xxs font-extrabold tracking-[0.12em] uppercase px-2.5 py-1 rounded-none mb-3.5 w-fit leading-none">
          {slide.badge}
        </span>
        <h1 className="text-fg font-display text-f-display-hero tracking-[-0.02em] mb-3 whitespace-pre-line break-words max-w-[520px] line-clamp-2 md:line-clamp-3">
          {slide.title}
        </h1>
        <p className="hero-subtitle hidden md:block text-f-md text-muted leading-relaxed mb-6 max-w-[400px]">
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
      {total > 1 && (
        <div className="absolute bottom-sp-4 md:bottom-6 left-9 md:left-11 flex gap-1.5">
          {data.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIdx(i)}
              aria-label={tCarousel('slideN', { n: i + 1 })}
              aria-current={i === idx ? 'true' : undefined}
              className="h-[3px] rounded-full border-none cursor-pointer p-0"
              style={{
                width: i === idx ? 28 : 16,
                background: i === idx ? 'var(--fg)' : 'var(--muted-2)',
                transition: prefersReduced ? 'none' : 'all var(--dur-standard) ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Arrows (desktop) */}
      {total > 1 && (
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
      )}
    </div>
  );
}
