import { NextRequest, NextResponse } from 'next/server'

// POST /api/likes/plan   body: { plan_id: string }  → social.plan_likes INSERT
// DELETE /api/likes/plan body: { plan_id: string }  → social.plan_likes DELETE

export async function POST(_req: NextRequest) {
  // TODO: getServerSession → session.user.id; INSERT INTO social.plan_likes (user_id, plan_id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest) {
  // TODO: getServerSession → session.user.id; DELETE FROM social.plan_likes WHERE user_id AND plan_id
  return NextResponse.json({ ok: true })
}
