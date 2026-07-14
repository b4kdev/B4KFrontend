import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'

// ── Rate limiters ──────────────────────────────────────────────────────────────
// Fail-open when env vars are missing (dev machines without Upstash creds).
// In production Vercel will have the real values; missing = 429 risk, not safety risk.
let rlGlobal: Ratelimit | null = null
let rlAuth: Ratelimit | null = null
let rlAiGenerate: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  // Global: 100 req / 10 s per IP
  rlGlobal = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '10 s'),
    prefix: 'b4k:rl:global',
    analytics: false,
  })

  // Auth routes: 10 req / 1 min per IP
  rlAuth = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'b4k:rl:auth',
    analytics: false,
  })

  // AI plan generation: 5 req / 1 min per IP
  rlAiGenerate = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'b4k:rl:ai-generate',
    analytics: false,
  })
} else {
  // eslint-disable-next-line no-console
  console.warn('[B4K] Upstash env vars missing — rate limiting disabled (fail-open)')
}

// ── Intl middleware (non-api routes only) ──────────────────────────────────────
const intlMiddleware = createIntlMiddleware(routing)

// ── IP extraction ──────────────────────────────────────────────────────────────
function getIp(req: NextRequest): string {
  return (
    req.ip ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  )
}

// ── 429 response ──────────────────────────────────────────────────────────────
function tooManyRequests(resetMs: number): NextResponse {
  const retryAfter = Math.ceil((resetMs - Date.now()) / 1000)
  return new NextResponse('Too Many Requests', {
    status: 429,
    headers: {
      'Retry-After': String(Math.max(retryAfter, 1)),
      'Content-Type': 'text/plain',
    },
  })
}

// ── Middleware ─────────────────────────────────────────────────────────────────
export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl

  // ── API routes: rate-limit then exit ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip = getIp(req)

    // Per-route limiters — most-specific first, then global.
    // Only one limiter fires per request.
    if (pathname === '/api/plans/generate' && rlAiGenerate) {
      const { success, reset } = await rlAiGenerate.limit(ip)
      if (!success) return tooManyRequests(reset)
    } else if (pathname.startsWith('/api/auth/') && rlAuth) {
      const { success, reset } = await rlAuth.limit(ip)
      if (!success) return tooManyRequests(reset)
    } else if (rlGlobal) {
      const { success, reset } = await rlGlobal.limit(ip)
      if (!success) return tooManyRequests(reset)
    }

    // ── Mock data layer (unchanged) ──────────────────────────────────────
    const isMockable =
      pathname === '/api/home' || pathname.startsWith('/api/explore/')
    if (isMockable && req.cookies.get('x-b4k-mock')?.value === '1') {
      const url = req.nextUrl.clone()
      url.pathname = pathname.replace('/api/', '/api/mock/')
      return NextResponse.rewrite(url)
    }

    return NextResponse.next()
  }

  // ── Non-API routes: Supabase session refresh + intl routing ──────────────
  // Build the intl response first so we can pass its headers through.
  let response = intlMiddleware(req)

  // Refresh the Supabase auth token so SSR can read the session on every page.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return req.cookies.get(name)?.value },
        set(name, value, options) {
          req.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          req.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    // Non-API pages (intl routing) — exclude api/, _next, _vercel, static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // All API routes (rate limiting + mock layer)
    '/api/:path*',
  ],
}
