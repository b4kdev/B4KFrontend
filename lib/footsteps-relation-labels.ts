// Client-safe half of lib/kpop-footsteps.ts's relation-label lookup. Split out because
// kpop-footsteps.ts imports 'server-only' (it calls bffFetch) — a client component can't
// import a value from that module without breaking the build, but this lookup has no
// server dependency and FootstepsDetailClient.tsx needs it for filter-chip labels.

const RELATION_LABELS: Record<string, { ko: string; en: string }> = {
  concert_venue: { ko: '콘서트 개최지', en: 'Concert Venue' },
  mv_location: { ko: '뮤직비디오 촬영지', en: 'MV Filming Location' },
  mv_filming: { ko: '뮤직비디오 촬영지', en: 'MV Filming Location' },
  associated: { ko: '연관 장소', en: 'Associated Place' },
  pilgrimage: { ko: '팬 성지', en: 'Fan Pilgrimage Site' },
  birthplace: { ko: '고향', en: 'Hometown' },
  agency: { ko: '소속사', en: 'Agency' },
  museum: { ko: '박물관·미술관', en: 'Museum' },
  park: { ko: '공원', en: 'Park' },
  cafe: { ko: '카페', en: 'Cafe' },
}

/** Label lookup for a relation/poi_type key — humanizes unknown values instead of failing. */
export function getRelationLabel(key: string, locale: string): string {
  const known = RELATION_LABELS[key]
  if (known) return locale === 'ko' ? known.ko : known.en
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
