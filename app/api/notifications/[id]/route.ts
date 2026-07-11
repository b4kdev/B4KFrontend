import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/notifications/:id  → social.notifications SET is_read = true

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  // TODO: getServerSession → verify ownership; UPDATE social.notifications SET is_read = true WHERE id AND user_id
  void params.id
  return NextResponse.json({ ok: true })
}
