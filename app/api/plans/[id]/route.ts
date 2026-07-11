import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/plans/:id — soft delete (sets deleted_at)
// Stub: returns success. Production: verify ownership, set deleted_at.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  return NextResponse.json({ success: true, id })
}
