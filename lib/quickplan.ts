// lib/quickplan.ts — 퀵플랜 모달의 상수 · 타입 · 순수 헬퍼.
// 칩/카테고리 라벨은 GET /interests 가 주므로 여기에 하드코딩하지 않는다.
import { REGION_API_NAME } from '@/hooks/useMapPois'

/** place_count 가 이 값 미만인 칩은 숨긴다 (nail 1, omakase 2, wine-bar 3 …). 조정 가능. */
export const MIN_CHIP_PLACE_COUNT = 10

/** 취향 칩 선택 상한 — PUT /me/interests 가 10 초과를 400 으로 거절한다. */
export const MAX_INTEREST_CHIPS = 10

/** 범용 성격의 칩 — 숨기지 않고 각 카테고리 맨 뒤로 보낸다. */
export const GENERIC_CHIP_SLUGS: ReadonlySet<string> = new Set([
  'brand-store', 'event', 'culture-facility', 'eco-spot', 'natural-wonder', 'industrial-tour',
])

/** 결과 단계 조회 상한 (GET /places?limit=). */
export const RESULT_LIMIT = 100

/** 코스 생성 규칙 — 하루 방문 수 / 최대 일수(날짜 범위가 이보다 길어도 자른다). */
export const STOPS_PER_DAY = 4
export const MAX_COURSE_DAYS = 8
/** 코스 후보 풀 크기 — /places 매칭 상위 N개 안에서만 고른다. */
export const COURSE_POOL_SIZE = 40

/** 1단계 주요 도시 목록. 키는 REGION_API_NAME(=/places?region= 값) 의 키와 같다. */
export const QUICKPLAN_CITIES = [
  'Seoul', 'Busan', 'Jeju', 'Incheon', 'Gyeongju', 'Daegu', 'Gwangju', 'Daejeon', 'Ulsan',
  'Sejong', 'Gyeonggi', 'Gangwon', 'Chungbuk', 'Chungnam', 'Jeonbuk', 'Jeonnam', 'Gyeongnam',
] as const
export type QuickPlanCity = (typeof QUICKPLAN_CITIES)[number]

export function cityToApiRegion(city: QuickPlanCity): string {
  return REGION_API_NAME[city] ?? city
}

export const COMPANIONS = ['solo', 'couple', 'friends', 'family'] as const
export type Companion = (typeof COMPANIONS)[number]

// ── /interests ────────────────────────────────────────────────────────────────
export type Labels = Partial<Record<string, string>> & { en?: string }

export interface InterestChip {
  slug: string
  labels: Labels
  sort_order: number
  place_count: number
}
export interface InterestCategory extends InterestChip {
  chips: InterestChip[]
}
export interface InterestsResponse {
  categories: InterestCategory[]
}

export function labelOf(x: { labels: Labels; slug: string }, lang: string): string {
  return x.labels[lang] ?? x.labels.en ?? x.slug
}

/** 숨김 기준 적용 + 범용 칩 뒤로 (그 외 순서는 API 의 sort_order 그대로). 칩이 없는 카테고리는 제외. */
export function visibleCategories(categories: InterestCategory[]): InterestCategory[] {
  return categories
    .map(cat => {
      const chips = cat.chips.filter(c => c.place_count >= MIN_CHIP_PLACE_COUNT)
      return {
        ...cat,
        chips: [
          ...chips.filter(c => !GENERIC_CHIP_SLUGS.has(c.slug)),
          ...chips.filter(c => GENERIC_CHIP_SLUGS.has(c.slug)),
        ],
      }
    })
    .filter(cat => cat.chips.length > 0)
}

// ── 결과 단계 장소 ───────────────────────────────────────────────────────────
export interface QuickPlanPlace {
  poi_id: number
  name_ko: string
  primary_image_url: string | null
  coords_lat: number | null
  coords_lng: number | null
  display_region: string | null
  interest_category: string | null
  interest_tags: string[] | null
  translations: Record<string, { name?: string }> | null
}

export function placeName(p: QuickPlanPlace, lang: string): string {
  const t = p.translations ?? {}
  return t[lang]?.name ?? (lang === 'ko' ? p.name_ko : t.en?.name ?? p.name_ko)
}

// ── 게스트 임시 보관 ─────────────────────────────────────────────────────────
// 비로그인은 칩 선택까지 가능. 저장(PUT)은 로그인 필요 → 로컬에 보관했다가 로그인 후 전송.
const DRAFT_KEY = 'b4k_quickplan_draft'
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000

export function saveDraftTags(tags: string[]): void {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ tags, ts: Date.now() })) } catch { /* storage unavailable */ }
}

export function readDraftTags(): string[] | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as { tags?: unknown; ts?: unknown }
    if (!Array.isArray(d.tags) || typeof d.ts !== 'number' || Date.now() - d.ts > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    return d.tags.filter((t): t is string => typeof t === 'string').slice(0, MAX_INTEREST_CHIPS)
  } catch { return null }
}

export function clearDraftTags(): void {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* storage unavailable */ }
}

// ── 날짜 ────────────────────────────────────────────────────────────────────
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// ─── 퀵플랜 결과 → 지도 "내 플랜" 패널 인계 ──────────────────────────────
// "완료" 를 누르면 코스를 여기 담고 /map?from=quickplan 으로 이동 → MapView 가 한 번 꺼내
// 플랜 빌더(초안)에 채운다. 저장(게시)은 사용자가 "내 플랜으로 저장" 으로 직접 한다.
// 탭 단위 1회성이라 sessionStorage.
export interface CourseHandoffStop {
  poi_id:             string
  name_ko:            string
  name_preferred?:    string
  coords_lat:         number
  coords_lng:         number
  display_region?:    string | null
  primary_image_url?: string
  day:                number
}

const COURSE_HANDOFF_KEY = 'b4k_quickplan_course'

export function saveCourseHandoff(stops: CourseHandoffStop[]): void {
  try { sessionStorage.setItem(COURSE_HANDOFF_KEY, JSON.stringify(stops)) } catch { /* storage unavailable */ }
}

/** 꺼내면서 지운다 — 새로고침으로 다시 덮어쓰지 않게. */
export function takeCourseHandoff(): CourseHandoffStop[] | null {
  try {
    const raw = sessionStorage.getItem(COURSE_HANDOFF_KEY)
    sessionStorage.removeItem(COURSE_HANDOFF_KEY)
    const stops = raw ? JSON.parse(raw) as CourseHandoffStop[] : null
    return Array.isArray(stops) && stops.length > 0 ? stops : null
  } catch {
    return null
  }
}
