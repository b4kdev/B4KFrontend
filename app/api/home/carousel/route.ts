import { NextResponse } from 'next/server'

// Hero carousel (SEC-22 / S-TEWNNV). Slides are CMS-managed in production
// (flexible card count, operator-authored copy per SPEC-01-home) — the slide
// title/subtitle/cta text is content, not UI chrome, so it ships from here
// rather than from i18n messages. Only the carousel controls (arrows, dots,
// aria labels) stay in next-intl.
export interface HomeCarouselSlide {
  id: string
  badge: string
  title: string
  subtitle: string
  image_url: string | null
  cta_href: string
  cta_label: string
}

const MOCK: HomeCarouselSlide[] = [
  {
    id: 'slide-kculture',
    badge: 'New Release',
    title: 'K-Culture\nImmersive 2024',
    subtitle: 'From backstreet jazz bars in Hongdae to private tea ceremonies in Insadong.',
    image_url: null,
    cta_href: '/explore/k-culture',
    cta_label: 'Discover Private Access',
  },
  {
    id: 'slide-boseong',
    badge: 'Seasonal',
    title: 'Boseong Tea\nFields in Mist',
    subtitle: "Rolling green terraces blanketed in morning fog. Korea's most serene landscape.",
    image_url: null,
    cta_href: '/map',
    cta_label: 'Explore Boseong',
  },
  {
    id: 'slide-seoul',
    badge: 'Nightlife',
    title: 'Seoul After\nMidnight',
    subtitle: 'The city transforms when the sun sets. Rooftop bars, lantern-lit alleys, neon horizons.',
    image_url: null,
    cta_href: '/map',
    cta_label: 'Plan the Night',
  },
]

export async function GET() {
  return NextResponse.json(MOCK)
}
