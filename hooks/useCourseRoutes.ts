import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { CoursePlace } from '@/lib/onboarding-course'

export interface CourseLeg {
  distance_m:   number
  duration_sec: number | null   // null = 경로 계산 실패로 직선 대체(시간 모름)
  path:         Array<{ lat: number; lng: number }>
}

export interface CourseDayRoute {
  legs:         CourseLeg[]     // stops.length - 1 개
  distance_m:   number
  duration_sec: number
  /** 일부/전체 구간이 실도로가 아닌 직선(또는 계산 실패)으로 그려졌는지 */
  approximate:  boolean
}

interface OsrmResponse {
  legs: Array<{
    distance_m:   number
    duration_sec: number
    method:       string
    geometry?: { type: 'LineString'; coordinates: Array<[number, number]> }
             | { type: 'MultiLineString'; coordinates: Array<Array<[number, number]>> } | null
  }>
}

// 이동수단은 관광객 기준 대중교통. (경로 함수가 도시 간·도로망 밖은 직선 근사로 채운다)
export const COURSE_TRAVEL_MODE = 'transit'
const MODE = COURSE_TRAVEL_MODE

function toPath(g: OsrmResponse['legs'][number]['geometry']): CourseLeg['path'] {
  if (!g) return []
  const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates
  // GeoJSON 은 [lng, lat] — 지도 SDK 용 {lat, lng} 로 뒤집는다.
  return lines.flat().map(([lng, lat]) => ({ lat, lng }))
}

function straight(a: CoursePlace, b: CoursePlace): CourseLeg {
  return {
    distance_m: 0, duration_sec: null,
    path: [{ lat: a.coords_lat, lng: a.coords_lng }, { lat: b.coords_lat, lng: b.coords_lng }],
  }
}

async function fetchDay(stops: CoursePlace[]): Promise<CourseDayRoute> {
  if (stops.length < 2) return { legs: [], distance_m: 0, duration_sec: 0, approximate: false }
  try {
    // 경로 함수는 BFF(`.../api`) 와 형제 경로(`.../osrm`) — apiFetch 의 토큰/에러 처리를 그대로 쓰려고 상대 경로로 접근.
    const res = await apiFetch<OsrmResponse>('/../osrm', {
      method: 'POST',
      body: JSON.stringify({ place_ids: stops.map(s => s.poi_id), mode: MODE }),
    })
    const legs: CourseLeg[] = res.legs.map(l => ({
      distance_m: l.distance_m, duration_sec: l.duration_sec, path: toPath(l.geometry),
    }))
    return {
      legs,
      distance_m:   legs.reduce((a, l) => a + l.distance_m, 0),
      duration_sec: legs.reduce((a, l) => a + (l.duration_sec ?? 0), 0),
      approximate:  res.legs.some(l => l.method !== 'pgr'),
    }
  } catch {
    // 경로 계산 실패해도 핀과 순서는 보여준다 — 직선으로 잇는다.
    return {
      legs: stops.slice(1).map((s, i) => straight(stops[i], s)),
      distance_m: 0, duration_sec: 0, approximate: true,
    }
  }
}

/** 일차별 경로(구간 거리·시간·도로 geometry). 일차마다 병렬 호출. */
export function useCourseRoutes(days: CoursePlace[][]) {
  const key = days.length > 0 ? ['course-routes', MODE, days.map(d => d.map(p => p.poi_id).join(',')).join('|')] : null
  const { data, isLoading } = useSWR(key, () => Promise.all(days.map(fetchDay)), { revalidateOnFocus: false })
  return { routes: data ?? null, isLoading }
}
