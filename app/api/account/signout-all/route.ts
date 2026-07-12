import { NextResponse } from 'next/server'

// POST /api/account/signout-all
// Real impl: getServerSession → supabase.auth.admin.signOut(userId, 'global')
//   (server-only admin client — revokes all refresh tokens across devices).
// Client then calls next-auth signOut() to clear the current session cookie.
export async function POST() {
  return NextResponse.json({ ok: true })
}
