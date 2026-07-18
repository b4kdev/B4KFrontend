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

const MOCK: HomeCarouselSlide[] = []

export async function GET() {
  return NextResponse.json(MOCK)
}
