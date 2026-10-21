import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { safePath } from '@/lib/safe-path'

// Supabase Auth password reset (S-JNCTDV Flow 6). resetPasswordForEmail()
// itself never errors for a non-existent account (Supabase's own enumeration
// guard) — the only errors that surface here are operational (rate limit,
// service outage), never "account doesn't exist". The emailed link lands on
// app/[locale]/auth/reset-password/page.tsx which completes the flow via
// POST /api/auth/reset-password.
export async function POST(req: Request) {
  const { email, next } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const origin = new URL(req.url).origin
  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // The reset link brings the person back to the page they asked from (same site only).
    redirectTo: `${origin}/auth/reset-password?next=${encodeURIComponent(safePath(next))}`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status ?? 400 })
  }

  return NextResponse.json({ ok: true })
}
