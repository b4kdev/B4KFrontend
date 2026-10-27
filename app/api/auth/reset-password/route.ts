import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { WEAK_PASSWORD, isWeakPasswordError, passwordProblem } from '@/lib/password'

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}))

  if (!token || !password) {
    return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
  }
  if (typeof password !== 'string' || passwordProblem(password)) {
    return NextResponse.json({ error: 'Password too weak', code: WEAK_PASSWORD }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()

  // Exchange the recovery token for a session (user-scoped, not admin)
  const { error: sessionErr } = await supabase.auth.exchangeCodeForSession(token)

  if (sessionErr) {
    const code = sessionErr.message?.includes('expired') ? 'expired' : 'invalid'
    return NextResponse.json({ error: sessionErr.message, code }, { status: 400 })
  }

  // Update password through the now-authenticated session
  const { error: updateErr } = await supabase.auth.updateUser({ password })

  if (updateErr) {
    if (isWeakPasswordError(updateErr)) return NextResponse.json({ error: updateErr.message, code: WEAK_PASSWORD }, { status: 400 })
    return NextResponse.json({ error: updateErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
