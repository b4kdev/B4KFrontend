import { NextRequest, NextResponse } from 'next/server'

// Visit /api/maintenance-bypass?token=<MAINTENANCE_BYPASS_TOKEN> to get past the
// maintenance gate in middleware.ts. Sets an httpOnly cookie, never exposes the
// token to client JS.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token')
  const expected = process.env.MAINTENANCE_BYPASS_TOKEN

  if (!expected || token !== expected) {
    return new NextResponse('Not found', { status: 404 })
  }

  const response = NextResponse.redirect(new URL('/', req.url))
  response.cookies.set('b4k_bypass', expected, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}
