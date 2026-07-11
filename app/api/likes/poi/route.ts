import { NextRequest, NextResponse } from 'next/server'

// POST /api/likes/poi   body: { place_id: string }  → social.poi_likes INSERT
// DELETE /api/likes/poi body: { place_id: string }  → social.poi_likes DELETE

export async function POST(_req: NextRequest) {
  // TODO: getServerSession → session.user.id; INSERT INTO social.poi_likes (user_id, place_id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest) {
  // TODO: getServerSession → session.user.id; DELETE FROM social.poi_likes WHERE user_id AND place_id
  return NextResponse.json({ ok: true })
}
