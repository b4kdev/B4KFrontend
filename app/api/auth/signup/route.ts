import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { safePath } from '@/lib/safe-path'
import { WEAK_PASSWORD, isWeakPasswordError, passwordProblem } from '@/lib/password'

// Supabase Auth sign-up with email verification (flow 1).
// Verification link → user confirms → auto-sign-in → interrupted action resumes.
// Response is intentionally generic on both new and already-registered emails
// (Supabase itself withholds the "already exists" signal for a confirmed
// email — signUp returns no error and a user with an empty `identities`
// array — so this route never needs to special-case it to avoid enumeration).
export async function POST(req: Request) {
  const { email, password, next } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (typeof password !== 'string' || passwordProblem(password)) {
    return NextResponse.json({ error: 'Password too weak', code: WEAK_PASSWORD }, { status: 400 })
  }

  const origin = new URL(req.url).origin
  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    // The confirmation link comes back to the page the visitor signed up from (same site only).
    options: { emailRedirectTo: `${origin}/auth/callback?returnTo=${encodeURIComponent(safePath(next))}` },
  })

  if (error) {
    if (isWeakPasswordError(error)) return NextResponse.json({ error: error.message, code: WEAK_PASSWORD }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: error.status ?? 400 })
  }

  return NextResponse.json({ ok: true })
}
