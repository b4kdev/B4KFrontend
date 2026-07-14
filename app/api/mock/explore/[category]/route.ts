import { NextRequest, NextResponse } from 'next/server'
import { EXPLORE_MOCK } from '@/lib/mock/explore'
import { mockCoordsFor } from '@/lib/mock-geo'

export async function GET(
  _req: NextRequest,
  { params }: { params: { category: string } }
) {
  const data = EXPLORE_MOCK[params.category]
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Quick-add-to-plan needs coords — this dev-toggle dataset never carried them
  const enriched = {
    ...data,
    sections: data.sections.map(s => ({
      ...s,
      items: s.items.map(it => {
        const { lat, lng } = mockCoordsFor(it.poi_id, it.display_region, it.district)
        return { ...it, coords_lat: lat, coords_lng: lng }
      }),
    })),
  }
  return NextResponse.json(enriched)
}
