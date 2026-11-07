export {}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    // GA4 events fired after Accept but before gtag is set up (lib/analytics.ts track)
    __b4kq?: [string, Record<string, unknown>][]
    clarity?: (...args: unknown[]) => void
  }
}
