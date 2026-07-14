// Mock-only — real POIs carry coords_lat/coords_lng from service.places_snapshot.
// Explore/Home mock POIs never had coords (no map tie-in was needed until
// "Add to Plan" from those cards required writing a MapPoi-shaped draft stop).
// Approximate district/city centers, not real POI addresses.
const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  '강남구': { lat: 37.5172, lng: 127.0473 }, 'Gangnam-gu, Seoul': { lat: 37.5172, lng: 127.0473 },
  '강동구': { lat: 37.5301, lng: 127.1238 },
  '경주': { lat: 35.8562, lng: 129.2247 }, 'Gyeongju': { lat: 35.8562, lng: 129.2247 },
  '구로구': { lat: 37.4954, lng: 126.8874 },
  '도봉구': { lat: 37.6688, lng: 127.0471 },
  '마포구': { lat: 37.5663, lng: 126.9019 }, 'Mapo-gu, Seoul': { lat: 37.5663, lng: 126.9019 },
  '서울': { lat: 37.5665, lng: 126.9780 }, 'Seoul': { lat: 37.5665, lng: 126.9780 },
  '서초구': { lat: 37.4837, lng: 127.0324 },
  '성동구': { lat: 37.5636, lng: 127.0365 }, 'Seongdong-gu, Seoul': { lat: 37.5636, lng: 127.0365 },
  '송파구': { lat: 37.5145, lng: 127.1059 }, 'Songpa-gu, Seoul': { lat: 37.5145, lng: 127.1059 },
  '수원': { lat: 37.2636, lng: 127.0286 },
  '안동': { lat: 36.5684, lng: 128.7294 }, 'Andong': { lat: 36.5684, lng: 128.7294 },
  '용산구': { lat: 37.5311, lng: 126.9810 }, 'Yongsan-gu, Seoul': { lat: 37.5311, lng: 126.9810 },
  '용인': { lat: 37.2411, lng: 127.1776 },
  '인천': { lat: 37.4563, lng: 126.7052 },
  '전주': { lat: 35.8242, lng: 127.1480 }, 'Jeonju, North Jeolla': { lat: 35.8242, lng: 127.1480 },
  '종로구': { lat: 37.5730, lng: 126.9794 }, 'Jongno-gu, Seoul': { lat: 37.5730, lng: 126.9794 },
  '중구': { lat: 37.5641, lng: 126.9979 }, 'Jung-gu, Seoul': { lat: 37.5641, lng: 126.9979 },
  '춘천': { lat: 37.8813, lng: 127.7298 }, 'Chuncheon, Gangwon': { lat: 37.8813, lng: 127.7298 },
  '파주': { lat: 37.7601, lng: 126.7799 },
  '포항': { lat: 36.0322, lng: 129.3650 },
  'Busan': { lat: 35.1796, lng: 129.0756 },
  'Gwangjin-gu, Seoul': { lat: 37.5384, lng: 127.0822 },
  'Gangneung, Gangwon': { lat: 37.7519, lng: 128.8761 },
  'Yangpyeong, Gyeonggi': { lat: 37.4916, lng: 127.4874 },
  // Chip-filter districts (finer than region) — checked first when present
  'Apgujeong': { lat: 37.5274, lng: 127.0287 },
  'Gangnam':   { lat: 37.4979, lng: 127.0276 },
  'Hongdae':   { lat: 37.5563, lng: 126.9237 },
  'Myeongdong': { lat: 37.5636, lng: 126.9834 },
}

const SEOUL_FALLBACK = { lat: 37.5665, lng: 126.9780 }

function hashJitter(id: string): { dLat: number; dLng: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const a = (Math.abs(h) % 1000) / 1000 - 0.5
  const b = (Math.abs(h >> 8) % 1000) / 1000 - 0.5
  return { dLat: a * 0.02, dLng: b * 0.02 } // ~±1km spread so same-district POIs don't stack
}

/** Deterministic approximate coords for a mock POI — same id always resolves to the same point. */
export function mockCoordsFor(id: string, region: string, district?: string): { lat: number; lng: number } {
  const base = (district ? REGION_COORDS[district] : undefined) ?? REGION_COORDS[region] ?? SEOUL_FALLBACK
  const { dLat, dLng } = hashJitter(id)
  return { lat: base.lat + dLat, lng: base.lng + dLng }
}
