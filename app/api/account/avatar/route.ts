import { NextRequest, NextResponse } from 'next/server'

// POST /api/account/avatar — multipart/form-data with `file` field.
// Real impl: getServerSession → validate file (type: image/jpeg|png|webp, max 2MB)
//   → upload to Cloudinary via server-side signed upload (CLOUDINARY_API_SECRET stays server-only)
//   → UPDATE accounts.users SET avatar_url = <cloudinary secure_url> WHERE id = user
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!file) {
    return NextResponse.json({ ok: false, error: 'missing_file' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, avatar_url: 'https://res.cloudinary.com/b4k/image/upload/v1/avatars/stub.jpg' })
}

// DELETE /api/account/avatar
// Real impl: getServerSession → destroy Cloudinary asset → UPDATE accounts.users SET avatar_url = NULL
export async function DELETE() {
  return NextResponse.json({ ok: true, avatar_url: null })
}
