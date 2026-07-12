import { NextResponse } from 'next/server'

// STUB — real implementation (S-JNCTDV Flow 6): Supabase Auth password reset:
//   const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
//   const { error } = await supabase.auth.resetPasswordForEmail(email, {
//     redirectTo: `${origin}/auth/reset-password`,   // existing reset page
//   })
// Always returns ok regardless of whether the account exists — never reveal
// account existence (enumeration guard). The emailed link lands on
// app/[locale]/auth/reset-password/page.tsx which completes the flow via
// POST /api/auth/reset-password.
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
