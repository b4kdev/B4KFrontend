import { NextResponse } from 'next/server'

// M4 — folder CRUD. Stub. Real impl (dev friend):
//   POST → INSERT INTO social.poi_folders (user_id, name) — enforce auth + name length.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 50) {
    return NextResponse.json({ error: 'invalid name' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, folder: { id: `folder-${name}`, name, pois: [], created_at: new Date(0).toISOString() } })
}
