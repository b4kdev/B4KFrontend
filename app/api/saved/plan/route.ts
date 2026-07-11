import { NextRequest, NextResponse } from 'next/server'

// POST /api/saved/plan   body: { plan_id: string }  → social.plan_saves INSERT
// DELETE /api/saved/plan body: { plan_id: string }  → social.plan_saves DELETE

export async function POST(_req: NextRequest) {
  // TODO: getServerSession → session.user.id; INSERT INTO social.plan_saves (user_id, plan_id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest) {
  // TODO: getServerSession → session.user.id; DELETE FROM social.plan_saves WHERE user_id AND plan_id
  return NextResponse.json({ ok: true })
}
