import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'

// ── Security headers ────────────────────────────────────────────────────────────
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://oapi.map.naver.com https://*.pstatic.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://*.pstatic.net https://*.map.naver.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.clarity.ms https://*.sentry.io https://oapi.map.naver.com https://*.map.naver.com https://*.nelo.navercorp.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('Content-Security-Policy', CSP)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  return res
}

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

// ── Maintenance mode ─────────────────────────────────────────────────────────────
// Gate everything behind a 503 when MAINTENANCE_MODE=1. Never gates Preview deploys
// (team needs those to keep working). Bypass: GET /api/maintenance-bypass?token=...
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === '1'
const BYPASS_TOKEN = process.env.MAINTENANCE_BYPASS_TOKEN
const BYPASS_COOKIE = 'b4k_bypass'
const BYPASS_PATH = '/api/maintenance-bypass'

function isBypassed(req: NextRequest): boolean {
  return Boolean(BYPASS_TOKEN) && req.cookies.get(BYPASS_COOKIE)?.value === BYPASS_TOKEN
}

function maintenanceResponse(): NextResponse {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>B4K — Under Maintenance</title>
<style>
  html,body{height:100%;margin:0}
  body{background:#0a0a0a;color:#ffffff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
  .card{max-width:420px}
  h1{font-size:20px;font-weight:600;margin:0 0 12px;color:#C4A8E0}
  p{font-size:14px;line-height:1.7;color:rgba(255,255,255,0.55);margin:0 0 8px}
</style>
</head>
<body>
  <div class="card">
    <h1>B4K is getting ready</h1>
    <p>We&rsquo;re putting the finishing touches on things. Check back shortly.</p>
    <p lang="ko">잠시 점검 중입니다. 곧 돌아오겠습니다.</p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '3600',
      'Cache-Control': 'no-store',
    },
  })
}

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

  // ── Maintenance gate — checked before rate-limiting/auth/intl work ────────
  const isPreview = process.env.VERCEL_ENV === 'preview'
  if (MAINTENANCE_MODE && !isPreview && pathname !== BYPASS_PATH && !isBypassed(req)) {
    return withSecurityHeaders(maintenanceResponse())
  }

  // ── API routes: rate-limit then exit ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip = getIp(req)

    // Per-route limiters — most-specific first, then global.
    // Only one limiter fires per request.
    // Fail-open on a live Upstash error (not just a missing env var) — a
    // rate-limiter outage should degrade rate limiting, not 500 every request.
    try {
      if (pathname === '/api/plans/generate' && rlAiGenerate) {
        const { success, reset } = await rlAiGenerate.limit(ip)
        if (!success) return withSecurityHeaders(tooManyRequests(reset))
      } else if (pathname.startsWith('/api/auth/') && rlAuth) {
        const { success, reset } = await rlAuth.limit(ip)
        if (!success) return withSecurityHeaders(tooManyRequests(reset))
      } else if (rlGlobal) {
        const { success, reset } = await rlGlobal.limit(ip)
        if (!success) return withSecurityHeaders(tooManyRequests(reset))
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[B4K] Rate limiter check failed — continuing without it', err)
    }

    return withSecurityHeaders(NextResponse.next())
  }

  // ── Non-API routes: Supabase session refresh + intl routing ──────────────
  // Build the intl response first so we can pass its headers through.
  const response = intlMiddleware(req)

  // Refresh the Supabase auth token so SSR can read the session on every page.
  // Fail-open on missing/invalid config — a bad env var should degrade auth,
  // not 500 every page (mirrors the Upstash fail-open pattern above).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
      })

      await supabase.auth.getUser()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[B4K] Supabase session refresh failed — continuing without it', err)
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn('[B4K] Supabase env vars missing — session refresh skipped (fail-open)')
  }

  return withSecurityHeaders(response)
}

export const config = {
  matcher: [
    // Non-API pages (intl routing) — exclude api/, _next, _vercel, static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // All API routes (rate limiting)
    '/api/:path*',
  ],
}
