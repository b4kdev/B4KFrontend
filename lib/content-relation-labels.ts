// Client-safe label lookup shared by the 5 Explore content-detail pages (footsteps,
// filming-spots, perfume-flagships, michelin-noodles, heritage). Split out because the
// lib/*.ts files next to this one import 'server-only' (they call bffFetch) — a client
// component can't import a value from those without breaking the build, but this lookup
// has no server dependency and every *DetailClient.tsx needs it for filter-chip labels.
//
// Covers both real API relation values (core.poi_context.relation — concert_venue,
// mv_location, associated, ...) and each page's seed-data poi_type buckets (museum/park/
// cafe, nature/historic/experience, seongsu/hannam/garosugil, gyeongju/andong/yeongju,
// naengmyeon) so one lookup works whichever source a given page is currently serving from.

const RELATION_LABELS: Record<string, { ko: string; en: string }> = {
  // core.poi_context.relation (real API)
  concert_venue: { ko: '콘서트 개최지', en: 'Concert Venue' },
  mv_location: { ko: '뮤직비디오 촬영지', en: 'MV Filming Location' },
  mv_filming: { ko: '뮤직비디오 촬영지', en: 'MV Filming Location' },
  associated: { ko: '연관 장소', en: 'Associated Place' },
  pilgrimage: { ko: '팬 성지', en: 'Fan Pilgrimage Site' },
  birthplace: { ko: '고향', en: 'Hometown' },
  agency: { ko: '소속사', en: 'Agency' },
  // kpop-footsteps.ts seed poi_type
  museum: { ko: '박물관·미술관', en: 'Museum' },
  park: { ko: '공원', en: 'Park' },
  cafe: { ko: '카페', en: 'Cafe' },
  // kdrama-filming-spots.ts seed poi_type
  nature: { ko: '자연', en: 'Nature' },
  historic: { ko: '역사', en: 'Historic' },
  experience: { ko: '체험', en: 'Experience' },
  // kbeauty-perfume-flagships.ts seed poi_type (district-based, not relation-based)
  seongsu: { ko: '성수', en: 'Seongsu' },
  hannam: { ko: '한남', en: 'Hannam' },
  garosugil: { ko: '가로수길', en: 'Garosu-gil' },
  other: { ko: '기타', en: 'Other' },
  // kfood-michelin-noodles.ts seed poi_type
  naengmyeon: { ko: '냉면', en: 'Naengmyeon' },
  // kculture-heritage.ts seed poi_type
  gyeongju: { ko: '경주', en: 'Gyeongju' },
  andong: { ko: '안동', en: 'Andong' },
  yeongju: { ko: '영주', en: 'Yeongju' },
}

/** Label lookup for a relation/poi_type key — humanizes unknown values instead of failing. */
export function getRelationLabel(key: string, locale: string): string {
  const known = RELATION_LABELS[key]
  if (known) return locale === 'ko' ? known.ko : known.en
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
