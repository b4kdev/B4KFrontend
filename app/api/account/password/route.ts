import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body.currentPassword || !body.newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify current password by re-authenticating
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: body.currentPassword,
  })
  if (signInErr) return NextResponse.json({ error: 'Invalid current password' }, { status: 401 })

  // Update password through the user's session
  const { error: updateErr } = await supabase.auth.updateUser({ password: body.newPassword })
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
