import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

// GET /api/places/areas → BFF GET /places/areas: the regions and their districts that have places,
// most places first, as the data names them (Korean). The search filter options; the query sends
// the same names back as region= and district=.
export type PlaceArea = { region: string; count: number; districts: { name: string; count: number }[] }

export async function GET() {
  try {
    return NextResponse.json(await bffFetch<PlaceArea[]>('/places/areas', { token: null }))
  } catch (e) {
    return bffErrorResponse(e)
  }
}
