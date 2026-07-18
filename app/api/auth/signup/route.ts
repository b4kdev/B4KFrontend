import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Supabase Auth sign-up with email verification (S-JNCTDV Flow 1).
// Verification link → user confirms → auto-sign-in → interrupted action resumes.
// Response is intentionally generic on both new and already-registered emails
// (Supabase itself withholds the "already exists" signal for a confirmed
// email — signUp returns no error and a user with an empty `identities`
// array — so this route never needs to special-case it to avoid enumeration).
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password too short' }, { status: 400 })
  }

  const origin = new URL(req.url).origin
  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status ?? 400 })
  }

  return NextResponse.json({ ok: true })
}
