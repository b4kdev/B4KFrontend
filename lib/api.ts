// lib/api.ts — the browser's BFF caller. It goes through the app's own proxy (/api/bff/<path>,
// app/api/bff/[...path]/route.ts), which adds the session from the cookie: the browser never calls
// the BFF host itself (no CORS, works on every origin). The frontend never calls Supabase Postgres
// directly — every data read/write goes through the BFF.

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/bff${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(json?.error ?? res.statusText, res.status)
  }
  return json as T
}
