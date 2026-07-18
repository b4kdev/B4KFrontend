import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// POST /api/saved/poi — save a POI → BFF POST /bookmarks/sync (bookmark_add)
// DELETE /api/saved/poi — unsave a POI → BFF POST /bookmarks/sync (bookmark_remove)
// Explicit add/remove ops (not toggle) so POST/DELETE intent is preserved.

interface SyncResult {
  results: Array<{ op_id: string; status: 'applied' | 'duplicate' | 'stale' | 'error'; error?: string }>
  server_time: string
}

async function syncOp(
  token: string,
  type: 'bookmark_add' | 'bookmark_remove',
  poi_id: string | number,
  folder_id?: string,
) {
  const op: Record<string, unknown> = {
    op_id: crypto.randomUUID(),
    type,
    ts: new Date().toISOString(),
    poi_id: Number(poi_id),
  }
  if (type === 'bookmark_add' && folder_id) op.folder_id = folder_id
  return bffFetch<SyncResult>('/bookmarks/sync', {
    method: 'POST',
    body: JSON.stringify({ ops: [op] }),
    token,
  })
}

export async function POST(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  const { poi_id, folder_id } = body
  if (!poi_id) return NextResponse.json({ error: 'missing_poi_id' }, { status: 400 })
  try {
    const res = await syncOp(auth.token, 'bookmark_add', poi_id, folder_id)
    const result = res.results?.[0]
    if (result?.status === 'error') {
      return NextResponse.json({ error: result.error ?? 'sync_failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true, poi_id, saved: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  const { poi_id } = body
  if (!poi_id) return NextResponse.json({ error: 'missing_poi_id' }, { status: 400 })
  try {
    const res = await syncOp(auth.token, 'bookmark_remove', poi_id)
    const result = res.results?.[0]
    if (result?.status === 'error') {
      return NextResponse.json({ error: result.error ?? 'sync_failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true, poi_id, saved: false })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
