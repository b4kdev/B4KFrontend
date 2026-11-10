import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withDbPoiIds } from '@/lib/db-poi-mapping'
import { withDbPlaces } from '@/lib/collections'
import { resolveMichelinNoodles } from '@/lib/kfood-michelin-noodles'

export async function GET(req: NextRequest) {
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'
  // The page sends its own locale; the cookie can lag behind the address the visitor opened.
  const locale = req.nextUrl.searchParams.get('locale') ?? (await cookies()).get('NEXT_LOCALE')?.value ?? 'en'

  // Each place shows its own name and district (the typed values only when it cannot be read).
  const data = await resolveMichelinNoodles(includeUnverified)
  return NextResponse.json({ ...data, items: withDbPlaces(withDbPoiIds(data.items), locale) })
}
