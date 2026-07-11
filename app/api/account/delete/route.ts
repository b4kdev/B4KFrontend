import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Stub — real impl: UPDATE accounts.users SET deleted_at = NOW() WHERE id = session.user.id
  return NextResponse.json({ ok: true })
}
