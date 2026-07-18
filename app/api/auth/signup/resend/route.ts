import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Resend the sign-up verification email. Client also enforces a 60s cooldown
// (S-JNCTDV); TODO server-side rate limiting (Upstash) — not wired yet.
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status ?? 400 })
  }

  return NextResponse.json({ ok: true })
}
