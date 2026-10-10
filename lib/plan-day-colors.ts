// 플랜 일차별 색 — 지도 경로·핀, 플랜 패널 일차 탭/헤더의 점이 같은 값을 쓴다.
// Naver Maps SDK 는 hex 만 받으므로 CSS 변수가 아닌 hex 로 둔다.
//
// 일차마다 아래 색 — "전체" 보기든 특정 일차를 고른 보기든 같은 색.
// dataviz 기본 범주 팔레트에서 지도 기본 핀 분홍(--map-pin)과 겹치는 magenta 슬롯을 뺀 7색, 고정 순서
// (validate_palette.js light: 인접 CVD ΔE ≥ 9.1, 정상시각 ≥ 22.9 PASS).
// 노랑·청록은 밝은 지도 대비 3:1 미만이라 색만으로 구분하지 않는다 — 핀 번호 + 패널의 "n일차" 라벨이 함께 간다.
export const PLAN_DAY_COLORS = [
  '#2a78d6', // allow-hex — 1일차 blue
  '#eb6834', // allow-hex — 2일차 orange
  '#1baf7a', // allow-hex — 3일차 aqua
  '#eda100', // allow-hex — 4일차 yellow
  '#008300', // allow-hex — 5일차 green
  '#4a3aa7', // allow-hex — 6일차 violet
  '#e34948', // allow-hex — 7일차 red
] as const

export function planDayColor(day: number): string {
  return PLAN_DAY_COLORS[(Math.max(1, Math.min(day, PLAN_DAY_COLORS.length)) - 1)]
}

/** 색 배경 위 핀 번호 글자색 — 밝은 배경(노랑·청록 등)은 어두운 글자. */
export function textOnColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return L > 0.3 ? '#111111' : '#ffffff' // allow-hex
}

/** 플랜 일차 상한 — 색 개수와 같다. */
export const MAX_PLAN_DAYS = PLAN_DAY_COLORS.length

/** 일차 목록 묶음 — activeDay 0(전체)이면 사용 중인 일차 전부, n 이면 그 일차 하나. 순서는 입력 순서 유지. */
export function groupStopsByDay<T extends { poi_id: string }>(
  stops: T[], stopDays: Record<string, number>, activeDay: number,
): Array<{ day: number; stops: T[] }> {
  const byDay = new Map<number, T[]>()
  for (const s of stops) {
    const day = stopDays[s.poi_id] ?? 1
    if (activeDay && day !== activeDay) continue
    byDay.set(day, [...(byDay.get(day) ?? []), s])
  }
  if (activeDay && !byDay.has(activeDay)) byDay.set(activeDay, [])
  return Array.from(byDay.entries()).sort(([a], [b]) => a - b).map(([day, list]) => ({ day, stops: list }))
}
