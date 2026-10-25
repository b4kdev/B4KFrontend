import { NextRequest, NextResponse } from 'next/server'

// GET /api/geo → { country } from the host's IP country header (Vercel sets x-vercel-ip-country);
// null where no host sets it (local runs). Locate me shows only for visitors in Korea.
export const dynamic = 'force-dynamic'

export function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country')
  return NextResponse.json({ country: country ? country.toUpperCase() : null }, { headers: { 'Cache-Control': 'private, no-store' } })
}
