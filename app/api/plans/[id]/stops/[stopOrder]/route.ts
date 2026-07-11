import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/plans/:id/stops/:stopOrder — update transport_mode for a stop (owner only)
// Stub: returns success. Production: verify ownership → UPDATE ai.plan_stops SET transport_mode = $1
// WHERE plan_id = $2 AND stop_order = $3
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; stopOrder: string } }
) {
  const { id, stopOrder } = params
  if (!id || !stopOrder) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }
  const body = await req.json().catch(() => ({}))
  const { transport_mode } = body as { transport_mode?: string }
  if (!transport_mode || !['car', 'public', 'walk'].includes(transport_mode)) {
    return NextResponse.json({ error: 'invalid_transport_mode' }, { status: 400 })
  }
  return NextResponse.json({ success: true, id, stop_order: Number(stopOrder), transport_mode })
}
