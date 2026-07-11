import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Stub — real impl: getServerSession() → Supabase admin updateUser({ password: newPassword })
  // Validate currentPassword, then update:
  //   await supabaseAdmin.auth.admin.updateUserById(session.user.supabase_uid, { password: newPassword })
  const body = await req.json().catch(() => ({}))
  if (!body.currentPassword || !body.newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
