import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── B4K MOCK DATA LAYER ────────────────────────────────────────────────────
  // To detach: remove this block + delete app/api/mock/ + components/dev/MockToggle
  // Also remove '/api/home' and '/api/explore/:path*' from matcher below.
  const isMockable = pathname === '/api/home' || pathname.startsWith('/api/explore/')
  if (isMockable) {
    if (req.cookies.get('x-b4k-mock')?.value === '1') {
      const url = req.nextUrl.clone()
      url.pathname = pathname.replace('/api/', '/api/mock/')
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }
  // ── END MOCK DATA LAYER ────────────────────────────────────────────────────

  return intlMiddleware(req)
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)' ,
    '/api/home',
    '/api/explore/:path*',
  ],
}
