import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { bffErrorResponse, bffFetch } from '@/lib/bff'

// Profile photo: the file goes to the public Storage bucket 'avatars' under the account's own
// folder (the bucket only lets an account write there), and its public address is set on the
// profile (BFF PUT /me avatar_url). The bucket takes JPEG, PNG or WebP up to 2 MB.
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_BYTES = 2 * 1024 * 1024

// POST /api/account/avatar — multipart/form-data with a `file` field → { ok, avatar_url }
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()
  if (!user || !session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'missing_file' }, { status: 400 })
  const ext = TYPES[file.type]
  if (!ext) return NextResponse.json({ ok: false, error: 'unsupported_type' }, { status: 415 })
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 })

  const path = `${user.id}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
  if (error) return NextResponse.json({ ok: false, error: 'upload_failed' }, { status: 502 })
  // The same address is reused on every change, so the version makes caches fetch the new photo.
  const avatar_url = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
  try {
    await bffFetch('/me', { method: 'PUT', body: JSON.stringify({ avatar_url }), token: session.access_token })
  } catch (e) {
    return bffErrorResponse(e)
  }
  return NextResponse.json({ ok: true, avatar_url })
}

// DELETE /api/account/avatar — removes the photo files and clears it on the profile.
export async function DELETE() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()
  if (!user || !session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  await supabase.storage.from('avatars').remove(Object.values(TYPES).map((ext) => `${user.id}/avatar.${ext}`))
  try {
    await bffFetch('/me', { method: 'PUT', body: JSON.stringify({ avatar_url: '' }), token: session.access_token })
  } catch (e) {
    return bffErrorResponse(e)
  }
  return NextResponse.json({ ok: true, avatar_url: null })
}
