import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

// The browser's BFF reads and writes (lib/api.ts apiFetch) go through here: same origin, so no CORS
// or per-origin key on the BFF, and the session comes from the cookie. Only the paths the screens
// use are allowed.
const ALLOWED: { method: string; path: RegExp }[] = [
  { method: 'GET', path: /^places$/ },
  { method: 'GET', path: /^places\/[A-Za-z0-9_-]+$/ },
  { method: 'GET', path: /^interests$/ },
  { method: 'GET', path: /^me\/interests$/ },
  { method: 'PUT', path: /^me\/interests$/ },
]

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/')
  if (!ALLOWED.some((a) => a.method === req.method && a.path.test(path))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  try {
    const body = req.method === 'GET' ? undefined : await req.text()
    const data = await bffFetch(`/${path}${req.nextUrl.search}`, { method: req.method, ...(body ? { body } : {}) })
    return NextResponse.json(data)
  } catch (e) {
    return bffErrorResponse(e)
  }
}

export { proxy as GET, proxy as PUT }
