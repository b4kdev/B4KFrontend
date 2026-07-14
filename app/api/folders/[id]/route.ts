import { NextResponse } from 'next/server'

// M4 — folder rename / delete. Stubs. Real impl (dev friend):
//   PATCH  → UPDATE social.poi_folders SET name = $1 WHERE id = $2 AND user_id = auth.uid()
//            (reject if the folder is the default "All Saved")
//   DELETE → move the folder's saves back to the default folder, then delete the folder
//            (DEC-24: POIs are never lost — they return to "All Saved")
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 50) {
    return NextResponse.json({ error: 'invalid name' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, id: params.id, name })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ ok: true, id: params.id })
}
