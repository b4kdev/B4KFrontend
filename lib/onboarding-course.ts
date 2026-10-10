// lib/onboarding-course.ts — 온보딩 "내 일정으로 저장" 시 코스 생성 (순수 함수, 서버 호출 없음).
// 매칭 상위 후보 중 기준점(1순위 장소) 근처만 골라 최근접 이웃 순서로 잇고, 일수대로 나눈다.
import {
  COURSE_POOL_SIZE, MAX_COURSE_DAYS, STOPS_PER_DAY, type OnboardingPlace,
} from './onboarding'

export interface CoursePlace extends OnboardingPlace {
  coords_lat: number
  coords_lng: number
}

const hasCoords = (p: OnboardingPlace): p is CoursePlace => p.coords_lat != null && p.coords_lng != null

/** 두 지점 간 직선거리(m) — haversine. */
export function distanceM(a: { coords_lat: number; coords_lng: number }, b: { coords_lat: number; coords_lng: number }): number {
  const R = 6371000
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.coords_lat - a.coords_lat)
  const dLng = rad(b.coords_lng - a.coords_lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.coords_lat)) * Math.cos(rad(b.coords_lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** 시작~종료 날짜(포함)의 일수. 날짜 미정/시작일만이면 1일. 1..MAX_COURSE_DAYS 로 자른다. */
export function courseDayCount(start: string | null, end: string | null): number {
  if (!start || !end) return 1
  const ms = new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()
  const days = Math.round(ms / 86_400_000) + 1
  return Math.min(Math.max(days, 1), MAX_COURSE_DAYS)
}

/**
 * places 는 API 의 매칭순(sort=match) 그대로 들어온다고 가정.
 * 1) 상위 COURSE_POOL_SIZE 중 1순위(기준점)에 가까운 순으로 dayCount*STOPS_PER_DAY 곳을 고르고
 * 2) 기준점에서 시작하는 최근접 이웃 순서(동선순)로 정렬한 뒤
 * 3) 하루 몫으로 순서대로 잘라 반환한다. 장소가 모자라면 뒤 일차가 비거나 짧아진다(빈 일차는 제외).
 */
export function buildCourse(places: OnboardingPlace[], dayCount: number): CoursePlace[][] {
  const pool = places.filter(hasCoords).slice(0, COURSE_POOL_SIZE)
  if (pool.length === 0) return []

  const anchor = pool[0]
  const need = Math.max(dayCount, 1) * STOPS_PER_DAY
  const picked = [...pool].sort((a, b) => distanceM(anchor, a) - distanceM(anchor, b)).slice(0, need)

  const route: CoursePlace[] = [anchor]
  const rest = picked.filter(p => p.poi_id !== anchor.poi_id)
  while (rest.length > 0) {
    const last = route[route.length - 1]
    let best = 0
    for (let i = 1; i < rest.length; i++) {
      if (distanceM(last, rest[i]) < distanceM(last, rest[best])) best = i
    }
    route.push(rest.splice(best, 1)[0])
  }

  const perDay = Math.ceil(route.length / Math.max(dayCount, 1))
  const days: CoursePlace[][] = []
  for (let i = 0; i < route.length; i += perDay) days.push(route.slice(i, i + perDay))
  return days
}
