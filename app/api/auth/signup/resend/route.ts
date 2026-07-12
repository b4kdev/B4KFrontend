import { NextResponse } from 'next/server'

// STUB — real implementation: resend the sign-up verification email:
//   const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
//   const { error } = await supabase.auth.resend({ type: 'signup', email })
// Rate-limited server-side (Upstash) in the real implementation; the client
// also enforces a 60s cooldown (S-JNCTDV).
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
