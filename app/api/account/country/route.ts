import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// POST /api/account/country → { country }
// Called once per sign-in. Keeps the country of the request (Vercel's IP country header, two
// letters, never the IP or the city) on the account, for counts by country:
//   country_first = the first country seen for the account (kept once set)
//   country_last  = the country of the latest sign-in
// Nothing is written where no host sets the header (local runs).
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const header = req.headers.get('x-vercel-ip-country')
  const country = header && /^[A-Za-z]{2}$/.test(header) ? header.toUpperCase() : null

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!country) return NextResponse.json({ country: null })

  const meta = user.user_metadata ?? {}
  if (meta.country_last !== country || !meta.country_first) {
    const { error } = await supabase.auth.updateUser({
      data: { country_first: meta.country_first ?? country, country_last: country },
    })
    if (error) return NextResponse.json({ country: null }, { status: 500 })
  }
  return NextResponse.json({ country }, { headers: { 'Cache-Control': 'private, no-store' } })
}
