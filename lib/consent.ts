export type ConsentState = 'accepted' | 'declined' | null

const KEY = 'b4k_analytics_consent'

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  return raw === 'accepted' || raw === 'declined' ? raw : null
}

// Analytics.tsx loads GA4 and Clarity only once this is 'accepted'. Declining after an
// Accept in the same visit sends GA4 and Clarity a consent update; the scripts go away on
// next load. Clarity never gets advertising consent.
export function setConsent(value: 'accepted' | 'declined'): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, value)
  window.gtag?.('consent', 'update', {
    analytics_storage: value === 'accepted' ? 'granted' : 'denied',
  })
  window.clarity?.('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: value === 'accepted' ? 'granted' : 'denied',
  })
  window.dispatchEvent(new CustomEvent('b4k-consent-change', { detail: value }))
}
