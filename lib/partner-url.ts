/**
 * A partner link that may reach the page: https only, a real host, no credentials in the URL.
 * Anything else (javascript:, data:, http:, relative paths, malformed) is dropped on the server.
 */
export function safePartnerUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' || !u.hostname.includes('.') || u.username || u.password) return null
    return u.toString()
  } catch {
    return null
  }
}

/** Keeps only the items whose partner_url passes safePartnerUrl. */
export const withSafePartnerUrls = <T extends { partner_url?: string | null }>(items: T[]): T[] =>
  items.flatMap((it) => {
    const url = safePartnerUrl(it.partner_url)
    return url ? [{ ...it, partner_url: url }] : []
  })
