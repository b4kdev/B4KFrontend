import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// POST /api/account/avatar — multipart/form-data with `file` field.
// Real impl: validate file (type: image/jpeg|png|webp, max 2MB)
//   → upload via server-side signed upload to whichever image host DEC-55 lands on
//   → UPDATE accounts.users SET avatar_url = <uploaded url> WHERE id = user.id
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!file) {
    return NextResponse.json({ ok: false, error: 'missing_file' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, avatar_url: '/images/avatars/stub.jpg' })
}

// DELETE /api/account/avatar
// Real impl: destroy the uploaded asset → UPDATE accounts.users SET avatar_url = NULL WHERE id = user.id
export async function DELETE() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ ok: true, avatar_url: null })
}
