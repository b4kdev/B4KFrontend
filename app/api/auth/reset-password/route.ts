import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { WEAK_PASSWORD, isWeakPasswordError, passwordProblem } from '@/lib/password'

export async function POST(req: Request) {
  const { token, token_hash, password } = await req.json().catch(() => ({}))

  if ((!token && !token_hash) || !password) {
    return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
  }
  if (typeof password !== 'string' || passwordProblem(password)) {
    return NextResponse.json({ error: 'Password too weak', code: WEAK_PASSWORD }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  // Turn the recovery link into a session (user-scoped, not admin). A token_hash link works in any
  // browser; a PKCE code only in the one that asked for the reset (it holds the code verifier).
  const { error: sessionErr } = token_hash
    ? await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
    : await supabase.auth.exchangeCodeForSession(token)

  if (sessionErr) {
    // A link that cannot be used (old, used, or a code opened in another browser) shows Link
    // expired, where the person asks for a new one; only a network or server failure is an error.
    const down =
      sessionErr.name === 'AuthRetryableFetchError' ||
      sessionErr.name === 'AuthUnknownError' ||
      (sessionErr.name === 'AuthApiError' && (sessionErr.status ?? 0) >= 500)
    if (down) return NextResponse.json({ error: sessionErr.message }, { status: 502 })
    return NextResponse.json({ error: sessionErr.message, code: 'expired' }, { status: 400 })
  }

  // Update password through the now-authenticated session
  const { error: updateErr } = await supabase.auth.updateUser({ password })

  if (updateErr) {
    if (isWeakPasswordError(updateErr)) return NextResponse.json({ error: updateErr.message, code: WEAK_PASSWORD }, { status: 400 })
    return NextResponse.json({ error: updateErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
