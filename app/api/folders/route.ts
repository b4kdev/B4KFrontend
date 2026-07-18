import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// M4 — folder CRUD, wired to the BFF.
//   GET  → BFF GET  /me/bookmark-folders
//   POST → BFF POST /me/bookmark-folders  body { name, folder_id? }

interface BffFolder {
  folder_id: string
  name: string
  is_default: boolean
  count: number
  created_at: string
  updated_at: string
}

export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const folders = await bffFetch<BffFolder[]>('/me/bookmark-folders', { token: auth.token })
    return NextResponse.json({
      folders: folders.map(f => ({
        id:         f.folder_id,
        name:       f.is_default ? 'All Saved' : f.name, // DEC-24 fixed label
        is_default: f.is_default,
        count:      f.count,
        created_at: f.created_at,
      })),
    })
  } catch (e) {
    return bffErrorResponse(e)
  }
}

export async function POST(req: Request) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 50) {
    return NextResponse.json({ error: 'invalid name' }, { status: 400 })
  }
  try {
    const created = await bffFetch<{ folder_id: string; name: string }>('/me/bookmark-folders', {
      method: 'POST',
      body: JSON.stringify({
        name,
        ...(typeof body?.folder_id === 'string' ? { folder_id: body.folder_id } : {}),
      }),
      token: auth.token,
    })
    return NextResponse.json({
      ok: true,
      folder: { id: created.folder_id, name: created.name, pois: [], created_at: new Date().toISOString() },
    })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
