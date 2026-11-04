import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { safePath } from '@/lib/safe-path'

// Resend the sign-up verification email. Client also enforces a 60s cooldown
// TODO server-side rate limiting (Upstash) — not wired yet.
export async function POST(req: Request) {
  const { email, next } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const origin = new URL(req.url).origin
  const supabase = await createSupabaseServerClient()
  // Same link as the first email: back to the page the visitor signed up from (same site only).
  // Without it the link falls back to the bare site address, which the email's link cannot use.
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?returnTo=${encodeURIComponent(safePath(next))}` },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status ?? 400 })
  }

  return NextResponse.json({ ok: true })
}
