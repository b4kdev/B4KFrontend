import { NextResponse } from 'next/server'

// STUB — real implementation (S-JNCTDV Flow 1): Supabase Auth sign-up with
// email verification:
//   const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
//   const { error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: { emailRedirectTo: `${origin}/auth/callback` },
//   })
// Verification link → accounts.users row created on confirm → auto-sign-in →
// interrupted action resumes. Returns a duplicate-safe generic response
// (never reveal whether the email is already registered).
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password too short' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
