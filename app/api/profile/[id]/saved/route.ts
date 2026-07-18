import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

// GET /api/profile/[id]/saved → BFF GET /profiles/:id/saved
// Anonymous allowed — the BFF honors saved_public (default private) and returns
// { pois: [], visible: false } when the list is hidden from the viewer.
// bffFetch auto-attaches the cookie session when present, so an owner viewing
// their own profile still sees their list.

interface BffProfileSaved {
  visible: boolean
  pois: Array<{
    poi_id: number
    name_ko: string | null
    display_region: string | null
    primary_image_url: string | null
    translations: Record<string, { name?: string; description?: string }> | null
    saved_at: string
  }>
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  try {
    const data = await bffFetch<BffProfileSaved>(
      `/profiles/${encodeURIComponent(params.id)}/saved`,
    )
    const items = (data.pois ?? []).map(p => ({
      poi_id:         String(p.poi_id),
      name_preferred: null,
      name_en:        p.translations?.en?.name ?? null,
      name_ko:        p.name_ko ?? null,
      display_region: p.display_region ?? null,
    }))
    return NextResponse.json({ items })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
