// Hero carousel (SEC-22 / S-TEWNNV). Slides are CMS-managed in production
// (flexible card count, operator-authored copy per SPEC-01-home) — the slide
// title/subtitle/cta text is content, not UI chrome, so it ships from here
// rather than from i18n messages. Only the carousel controls (arrows, dots,
// aria labels) stay in next-intl.
//
// Split out of route.ts (BLK-30): a route.ts file may only export the
// standard Next.js route fields (GET/POST/config/etc) — a plain data export
// fails the build's route type-check. app/[locale]/page.tsx imports SEED
// directly from here to render the hero slide server-side, so the hero's
// LCP image isn't stuck behind a client-only fetch waterfall.
export interface HomeCarouselSlide {
  id: string
  badge: string
  title: string
  subtitle: string
  image_url: string | null
  cta_href: string
  cta_label: string
}

// Interim content seed — real DB row (poi_id KD016-014), cross-checked against
// B4K_POI_DB_IMPORT_CLEANED_1500.xlsx. image_url null - image host TBD, see DEC-55.
export const SEED: HomeCarouselSlide[] = [
  {
    id: 'KD016-014',
    badge: 'FEATURED SPOT',
    title: 'Gyeongbokgung Palace',
    subtitle: "종로구 사직로 161 — Korea's grandest royal palace, still guarded by a changing-of-the-guard ceremony.",
    image_url: '/images/home/hero/KD016-014_gyeongbokgung-hero-wide.webp',
    cta_href: '/explore/k-culture',
    cta_label: 'EXPLORE K-CULTURE',
  },
]
