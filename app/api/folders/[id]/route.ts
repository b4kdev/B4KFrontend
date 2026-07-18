import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// M4 — folder rename / delete, wired to the BFF (folder id = UUID string).
//   PATCH  → BFF PUT    /me/bookmark-folders/:id  body { name }
//            (BFF rejects renaming the Default "All Saved" folder)
//   DELETE → BFF DELETE /me/bookmark-folders/:id
//            ⚠ BFF semantics: bookmarks inside the folder are deleted with it
//            (not moved back to "All Saved" as DEC-24 describes — backend gap).

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 50) {
    return NextResponse.json({ error: 'invalid name' }, { status: 400 })
  }
  try {
    const data = await bffFetch<{ folder_id: string; name: string }>(
      `/me/bookmark-folders/${encodeURIComponent(params.id)}`,
      { method: 'PUT', body: JSON.stringify({ name }), token: auth.token },
    )
    return NextResponse.json({ ok: true, id: data.folder_id, name: data.name })
  } catch (e) {
    return bffErrorResponse(e)
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    await bffFetch<{ folder_id: string; deleted_bookmarks: number }>(
      `/me/bookmark-folders/${encodeURIComponent(params.id)}`,
      { method: 'DELETE', token: auth.token },
    )
    return NextResponse.json({ ok: true, id: params.id })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
