import type { Plan } from '@/app/api/plans/route'

// SC-28 — lives outside app/api/plans/route.ts because Next's route-handler
// type check rejects any named export from a route.ts file that isn't
// GET/POST/etc. or a recognized config key. app/sitemap.ts imports this to
// list published plans without duplicating mock data.
//
// No data store wired yet — kept as an empty array (rather than deleted)
// because app/sitemap.ts (out of scope for this task) still imports it.
// Honest state: no published plans exist yet, so the sitemap emits none.
export const MOCK_PLANS: Plan[] = []
