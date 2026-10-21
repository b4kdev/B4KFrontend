import type { User } from '@supabase/supabase-js'

/** Date of the Terms and Privacy Policy the Consent step agrees to; a newer date asks again. */
export const CONSENT_VERSION = '2026-07-24'

/** True when a signed-in user has not completed the Consent step for the current documents. */
export function needsConsent(user: User | null | undefined): boolean {
  if (!user) return false
  const consent = user.user_metadata?.consent as { terms_version?: string } | undefined
  return consent?.terms_version !== CONSENT_VERSION
}

/** After a sign-in: the Consent step first if the account has not agreed yet, then the target. */
export const afterSignIn = (user: User | null | undefined, target: string) =>
  needsConsent(user) ? `/consent?next=${encodeURIComponent(target)}` : target
