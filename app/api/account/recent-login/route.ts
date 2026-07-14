import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET /api/account/recent-login → { recent: boolean }
// Real impl: compare last_sign_in_at from Supabase auth user to now;
//   recent = signed in within the last 10 minutes (SPEC-09 §Account deletion).
// Stub returns false so the re-auth step is exercised in dev.
export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ recent: false })
}

// POST /api/account/recent-login   body: { password: string }
// Re-auth verify. Real impl: supabase.auth.signInWithPassword(email, password)
//   server-side; success refreshes the recent-login window. 401 on wrong password.
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (typeof body.password !== 'string' || body.password.length === 0) {
    return NextResponse.json({ ok: false, error: 'invalid_password' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
