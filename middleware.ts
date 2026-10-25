import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createServerClient } from '@supabase/ssr'
import { routing, RETIRED_LOCALES } from './i18n/routing'
import { isV2Live, v2LiveAlias, V2_LIVE_HEADER } from './lib/v2-live'

// ── Security headers ────────────────────────────────────────────────────────────
// 'unsafe-eval' is added to script-src only in dev — Next.js Fast Refresh
// runtime uses eval() to apply hot updates. Production builds don't need it.
const isDev = process.env.NODE_ENV === 'development'
// Naver Maps SDK issues its own follow-up requests (auth, tile styles) using
// the same scheme as the page that loaded it. `next dev` serves plain HTTP,
// so those come back as http:// and get silently killed by an https-only
// CSP — the SDK then shows a generic "auth failed" message with no hint the
// real cause is our own header. Dev-only, matches the unsafe-eval pattern
// below; production is always https so these never apply there.
const devNaverHttp = isDev
  ? ' http://oapi.map.naver.com http://*.map.naver.com http://*.map.naver.net http://static.naver.net'
  : ''
// Vercel Analytics and Speed Insights load their debug scripts from va.vercel-scripts.com in dev;
// in production they are served from the site's own /_vercel path.
const devVercel = isDev ? ' https://va.vercel-scripts.com' : ''
// GA4 sends from regional hosts (region1.google-analytics.com) and www.google.com/g/collect, Clarity syncs through c.bing.com,
// Sentry ingests on *.ingest.sentry.io; place photos may be plain Supabase Storage URLs.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://*.clarity.ms https://oapi.map.naver.com https://*.pstatic.net${devNaverHttp}${devVercel}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://www.googletagmanager.com https://*.google-analytics.com https://*.pstatic.net https://*.map.naver.com https://*.clarity.ms https://c.bing.com${devNaverHttp}`,
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.b4korea.com https://www.googletagmanager.com https://www.google.com https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://c.bing.com https://*.sentry.io https://oapi.map.naver.com https://*.map.naver.com https://maps.apigw.ntruss.com https://*.nelo.navercorp.com${devVercel}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

// Location for Locate me only; everything else the site never asks for.
const PERMISSIONS = 'geolocation=(self), camera=(), microphone=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), browsing-topics=()'

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('Content-Security-Policy', CSP)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', PERMISSIONS)
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  return res
}

// ── Rate limiters ──────────────────────────────────────────────────────────────
// Without the env vars (dev machines without Upstash creds) the global limit is off and auth and
// AI generate use the in-memory fallback below. Production must have the real values.
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
  console.warn('[B4K] Upstash env vars missing — global rate limit off, auth and AI on the in-memory limit')
}

// In-memory fallback for the sensitive limits (auth, AI generate) when Upstash is missing or
// down: per server instance only, so looser than Upstash, but never unlimited.
const memHits = new Map<string, number[]>()
function memLimit(key: string, max: number, windowMs: number): { success: boolean; reset: number } {
  const now = Date.now()
  const hits = (memHits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= max) {
    memHits.set(key, hits)
    return { success: false, reset: hits[0] + windowMs }
  }
  hits.push(now)
  if (memHits.size > 10_000) memHits.clear()
  memHits.set(key, hits)
  return { success: true, reset: now + windowMs }
}

// ── Intl middleware (non-api routes only) ──────────────────────────────────────
const intlMiddleware = createIntlMiddleware(routing)

// /zh-CN/... and /th/... (retired locales) → /en/... with a permanent
// redirect, keeping the rest of the path and the query string.
const RETIRED_LOCALE_RE = new RegExp(`^/(${RETIRED_LOCALES.join('|')})(?=/|$)`, 'i')

// ── New design, live areas (lib/v2-live.ts) ──────────────────────────────────────
// /<locale>[/v2]<path>: groups are the locale, the /v2 preview prefix, and the rest of the path.
const V2_ROUTE_RE = new RegExp(`^/(${routing.locales.join('|')})(/v2(?=/|$))?(/.*)?$`)

// Serves /<locale><path> from the v2 screen at /<locale>/v2<path>, keeping what the intl
// middleware set on its own response (locale cookie, alternate links) and the locale request
// header it forwards.
function rewriteToV2(req: NextRequest, intl: NextResponse, locale: string, path: string): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = `/${locale}/v2${path === '/' ? '' : path}`
  const headers = new Headers(req.headers)
  headers.set('X-NEXT-INTL-LOCALE', locale)
  headers.set(V2_LIVE_HEADER, '1')
  const res = NextResponse.rewrite(url, { request: { headers } })
  intl.cookies.getAll().forEach((c) => res.cookies.set(c))
  const link = intl.headers.get('Link')
  if (link) res.headers.set('Link', link)
  return res
}

// ── Maintenance mode ─────────────────────────────────────────────────────────────
// Gate everything behind a 503 when MAINTENANCE_MODE=1. Never gates Preview deploys
// (team needs those to keep working). Bypass: GET /api/maintenance-bypass?token=...
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === '1'
const BYPASS_TOKEN = process.env.MAINTENANCE_BYPASS_TOKEN
const BYPASS_COOKIE = 'b4k_bypass'
const BYPASS_PATH = '/api/maintenance-bypass'

// Plain-JS constant-time compare — middleware runs on the Edge Runtime, which
// has no Node `crypto` module (`crypto.timingSafeEqual` isn't available here),
// only Web-standard APIs. XORs every byte regardless of an early mismatch so
// comparison time doesn't leak how many leading bytes matched.
function timingSafeEqual(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a)
  const bufB = new TextEncoder().encode(b)
  if (bufA.length !== bufB.length) return false
  let diff = 0
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i]
  return diff === 0
}

function isBypassed(req: NextRequest): boolean {
  const cookieValue = req.cookies.get(BYPASS_COOKIE)?.value
  return Boolean(BYPASS_TOKEN) && Boolean(cookieValue) && timingSafeEqual(cookieValue!, BYPASS_TOKEN!)
}

function maintenanceResponse(): NextResponse {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>B4K is under maintenance</title>
<style>
  /* Values copied from app/tokens.css (this page is served before any app CSS):
     neutral-100 bg, neutral-950 fg, neutral-550 muted in light; neutral-950, neutral-50, neutral-450 in dark. */
  :root{color-scheme:light dark;--bg:#f5f5f3;--fg:#0a0a0a;--muted:#636362}
  @media (prefers-color-scheme:dark){:root{--bg:#0a0a0a;--fg:#f7f6f3;--muted:#8f8e8c}}
  html,body{height:100%;margin:0}
  body{background:var(--bg);color:var(--fg);font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px}
  .card{max-width:400px}
  h1{font-size:20px;line-height:1.25;font-weight:600;margin:0 0 8px}
  p{font-size:14px;line-height:1.5;color:var(--muted);margin:0 0 4px}
</style>
</head>
<body>
  <div class="card">
    <h1>We&rsquo;ll be back soon</h1>
    <p>B4K is being updated. Check back in a little while.</p>
    <p lang="ko">곧 돌아올게요. B4K를 업데이트하고 있어요. 잠시 후 다시 확인해 주세요.</p>
    <p lang="ja">まもなく再開します。B4Kは現在更新中です。しばらくしてからもう一度アクセスしてください。</p>
    <p lang="zh-TW">我們很快回來。B4K 正在更新，請稍後再回來看看。</p>
    <p lang="pt-BR">Voltamos em breve. O B4K está sendo atualizado. Volte daqui a pouco.</p>
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

    // Per-route limiters — most-specific first, then global. Only one limiter fires per request.
    // Auth and AI generate never run unlimited: without Upstash (missing env or a live error)
    // they fall back to the in-memory limit. The global limit stays fail-open on an outage, so a
    // rate-limiter outage degrades rate limiting instead of failing every request.
    const sensitive =
      pathname === '/api/plans/generate' ? { rl: rlAiGenerate, key: `ai:${ip}`, max: 5 } :
      pathname.startsWith('/api/auth/') ? { rl: rlAuth, key: `auth:${ip}`, max: 10 } :
      null
    if (sensitive) {
      let result: { success: boolean; reset: number }
      try {
        result = sensitive.rl ? await sensitive.rl.limit(ip) : memLimit(sensitive.key, sensitive.max, 60_000)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[B4K] Rate limiter check failed — using the in-memory limit', err)
        result = memLimit(sensitive.key, sensitive.max, 60_000)
      }
      if (!result.success) return withSecurityHeaders(tooManyRequests(result.reset))
    } else if (rlGlobal) {
      try {
        const { success, reset } = await rlGlobal.limit(ip)
        if (!success) return withSecurityHeaders(tooManyRequests(reset))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[B4K] Rate limiter check failed — continuing without it', err)
      }
    }

    return withSecurityHeaders(NextResponse.next())
  }

  // ── Retired locales → en ──────────────────────────────────────────────────
  if (RETIRED_LOCALE_RE.test(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = pathname.replace(RETIRED_LOCALE_RE, '/en')
    return withSecurityHeaders(NextResponse.redirect(url, 308))
  }

  // ── New design: live areas are served by their v2 screens ─────────────────
  // The old preview address of a live area, and the old live addresses without a v2 screen,
  // move to the live address; the live address renders the v2 screen without changing the URL.
  const v2Route = V2_ROUTE_RE.exec(pathname)
  const v2Path = v2Route?.[3] ?? ''
  const v2Alias = v2Route && !v2Route[2] ? v2LiveAlias(v2Path) : null
  if (v2Route && ((v2Route[2] && isV2Live(v2Path)) || v2Alias)) {
    const [targetPath, targetQuery] = (v2Alias ?? v2Path).split('?')
    const url = req.nextUrl.clone()
    url.pathname = `/${v2Route[1]}${targetPath === '/' ? '' : targetPath}`
    // An alias may carry its own query (/plan → /map?plan=new); the request's query is kept too.
    new URLSearchParams(targetQuery ?? '').forEach((v, key) => url.searchParams.set(key, v))
    // Old preview addresses and old live addresses moved for good (308); the v2 layout keeps noindex
    // while a preview page still answers.
    return withSecurityHeaders(NextResponse.redirect(url, 308))
  }

  // ── Non-API routes: Supabase session refresh + intl routing ──────────────
  // Build the intl response first so we can pass its headers through.
  let response = intlMiddleware(req)
  if (v2Route && !v2Route[2] && isV2Live(v2Path) && response.status < 300 && !response.headers.has('x-middleware-rewrite')) {
    response = rewriteToV2(req, response, v2Route[1], v2Path)
  }

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
