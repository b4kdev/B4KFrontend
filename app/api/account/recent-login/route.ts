import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const RECENT_WINDOW_MS = 10 * 60 * 1000

// GET /api/account/recent-login → { recent: boolean }
// recent = signed in within the last 10 minutes (SPEC-09 §Account deletion).
export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0
  const recent = Date.now() - lastSignIn < RECENT_WINDOW_MS
  return NextResponse.json({ recent })
}

// POST /api/account/recent-login   body: { password: string }
// Re-auth verify via Supabase signInWithPassword. 401 on wrong password.
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (typeof body.password !== 'string' || body.password.length === 0) {
    return NextResponse.json({ ok: false, error: 'invalid_password' }, { status: 400 })
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: body.password,
  })
  if (error) return NextResponse.json({ ok: false, error: 'invalid_password' }, { status: 401 })

  return NextResponse.json({ ok: true })
}
