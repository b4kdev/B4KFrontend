export type ConsentState = 'accepted' | 'declined' | null

const KEY = 'b4k_analytics_consent'

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  return raw === 'accepted' || raw === 'declined' ? raw : null
}

// DEC-16 — GA4 Consent Mode v2: 'declined' keeps analytics_storage denied (GA4 still
// pings cookieless). Clarity has no consent-mode equivalent — Analytics.tsx hard-blocks
// its script tag entirely until this resolves to 'accepted'.
export function setConsent(value: 'accepted' | 'declined'): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, value)
  window.gtag?.('consent', 'update', {
    analytics_storage: value === 'accepted' ? 'granted' : 'denied',
  })
  window.dispatchEvent(new CustomEvent('b4k-consent-change', { detail: value }))
}
