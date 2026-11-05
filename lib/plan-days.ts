// Plan days within the plan limits the backend enforces on every save: at most 6 stops a day and
// day 1 to 8 (48 stops). Shared by the save routes (server) and the plan hand-off on the map (client).

export const PLAN_MAX_DAYS = 8
export const PLAN_PER_DAY = 6

const dayOf = (p: { day?: number | null }) =>
  typeof p.day === 'number' && Number.isInteger(p.day) && p.day >= 1 ? p.day : 1

/** The same stops, in the same order, on days that fit the limits. A plan that fits keeps its days.
 *  Otherwise a day with more than 6 stops goes on over the next day (later days move along); while
 *  that makes more than 8 days, the two neighbouring days with the fewest stops together (6 at most)
 *  become one; if no two fit, the stops fill each day to 6 in plan order. `places` must be in plan
 *  order (day, then visit order); a missing day counts as day 1. */
export function fitDays<P extends { day?: number | null }>(places: P[]): (P & { day: number })[] {
  const days = places.map(dayOf)
  const perDay = new Map<number, number>()
  for (const d of days) perDay.set(d, (perDay.get(d) ?? 0) + 1)
  if (Math.max(0, ...perDay.keys()) <= PLAN_MAX_DAYS && [...perDay.values()].every((n) => n <= PLAN_PER_DAY)) {
    return places.map((p, i) => ({ ...p, day: days[i] }))
  }
  // Split each day into runs of 6, in day order; each run is a day.
  const order = places.map((p, i) => ({ p, d: days[i], i })).sort((a, b) => a.d - b.d || a.i - b.i)
  const runs: P[][] = []
  let last = 0
  for (const { p, d } of order) {
    const run = runs[runs.length - 1]
    if (!run || d !== last || run.length === PLAN_PER_DAY) runs.push([p])
    else run.push(p)
    last = d
  }
  while (runs.length > PLAN_MAX_DAYS) {
    let best = -1
    for (let i = 0; i < runs.length - 1; i++) {
      const n = runs[i].length + runs[i + 1].length
      if (n <= PLAN_PER_DAY && (best < 0 || n < runs[best].length + runs[best + 1].length)) best = i
    }
    if (best < 0) return order.map(({ p }, i) => ({ ...p, day: Math.floor(i / PLAN_PER_DAY) + 1 }))
    runs.splice(best, 2, [...runs[best], ...runs[best + 1]])
  }
  return runs.flatMap((run, i) => run.map((p) => ({ ...p, day: i + 1 })))
}
