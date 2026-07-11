import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/plans/:id  → ai.plans soft-delete (sets deleted_at = now())

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  // TODO: getServerSession → verify session.user.id === plans.author_id
  //       UPDATE ai.plans SET deleted_at = now() WHERE id = params.id AND author_id = user_id
  void params.id
  return NextResponse.json({ ok: true })
}
