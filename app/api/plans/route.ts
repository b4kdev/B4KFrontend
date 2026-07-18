import { NextResponse } from 'next/server'

export interface PlanStop {
  poi_id:      string
  stop_order:  number
  duration_min: number
  transport_mode: 'car' | 'public'
}

export interface Plan {
  id:          string
  title:       string
  stop_count:  number
  is_published: boolean
  is_partner:  boolean
  created_at:  string
}

export interface PlansData {
  plans: Plan[]
}

export async function GET() {
  // No data store wired yet — honest response: no plans exist.
  return NextResponse.json({ plans: [] } satisfies PlansData)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const newPlan: Plan = {
    id:          `plan-${Date.now()}`,
    title:       body.title ?? `My Plan · ${new Date().toLocaleDateString()}`,
    stop_count:  Array.isArray(body.stops) ? body.stops.length : 0,
    is_published: body.is_published ?? false,
    is_partner:  false,
    created_at:  new Date().toISOString(),
  }
  return NextResponse.json({ plan: newPlan }, { status: 201 })
}
