const KEY = 'b4k_terms_accepted_v1'

export function hasAcceptedTerms(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(KEY) === 'true'
}

export function acceptTerms(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, 'true')
}
