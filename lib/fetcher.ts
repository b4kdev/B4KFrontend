export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`fetch ${res.status}: ${text}`)
  }
  const json = await res.json()
  return (json.data ?? json) as T
}
