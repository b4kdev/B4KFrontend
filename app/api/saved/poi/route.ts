import { NextRequest, NextResponse } from 'next/server'

// POST /api/saved/poi   body: { place_id: string }  → social.poi_saves INSERT
// DELETE /api/saved/poi body: { place_id: string }  → social.poi_saves DELETE

export async function POST(_req: NextRequest) {
  // TODO: getServerSession → session.user.id; INSERT INTO social.poi_saves (user_id, place_id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest) {
  // TODO: getServerSession → session.user.id; DELETE FROM social.poi_saves WHERE user_id AND place_id
  return NextResponse.json({ ok: true })
}
