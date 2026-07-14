import type { Plan } from '@/app/api/plans/route'

// SC-28 — lives outside app/api/plans/route.ts because Next's route-handler
// type check rejects any named export from a route.ts file that isn't
// GET/POST/etc. or a recognized config key. app/sitemap.ts imports this to
// list published plans without duplicating mock data.
export const MOCK_PLANS: Plan[] = [
  {
    id:          'plan-001',
    title:       'Seoul Highlights',
    stop_count:  4,
    is_published: true,
    is_partner:  false,
    created_at:  new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id:          'plan-002',
    title:       'Bukchon & Insadong Walk',
    stop_count:  3,
    is_published: false,
    is_partner:  false,
    created_at:  new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]
