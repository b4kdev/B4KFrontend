import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}))

  if (!token || !password) {
    return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password too short' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Exchange the recovery token for a session, then update the password
  const { error: sessionErr } = await supabase.auth.exchangeCodeForSession(token)

  if (sessionErr) {
    const code = sessionErr.message?.includes('expired') ? 'expired' : 'invalid'
    return NextResponse.json({ error: sessionErr.message, code }, { status: 400 })
  }

  const { error: updateErr } = await supabase.auth.updateUser({ password })

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
