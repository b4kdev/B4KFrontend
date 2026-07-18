export interface FetchError extends Error {
  status: number
  info: unknown
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const info = await res.json().catch(() => null)
    const err = new Error(`fetch ${res.status}`) as FetchError
    err.status = res.status
    err.info = info
    throw err
  }
  const json = await res.json()
  return (json.data ?? json) as T
}
