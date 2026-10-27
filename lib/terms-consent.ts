/** Date of the Terms and Privacy Policy the Consent step agrees to; a newer date asks again. */
export const CONSENT_VERSION = '2026-07-24'

/** What a sign-in has to settle first (GET /api/account/status). */
export type AccountStatus = { ok: boolean; deleted_at: string | null; restore_deadline: string | null; terms_version: string | null }

/** The signed-in account's status; null when it could not be read. */
export async function fetchAccountStatus(): Promise<AccountStatus | null> {
  return fetch('/api/account/status').then((r) => (r.ok ? r.json() : null)).catch(() => null)
}

/** True when the account's consent record is missing or older than the current documents. When the
 * profile could not be read the sign-in goes on: the Consent step could not save either. */
export function needsConsent(status: AccountStatus | null | undefined): boolean {
  return !!status?.ok && status.terms_version !== CONSENT_VERSION
}

/** After a sign-in: the Consent step first if the account has not agreed yet, then the target. */
export const afterSignIn = (status: AccountStatus | null | undefined, target: string) =>
  needsConsent(status) ? `/consent?next=${encodeURIComponent(target)}` : target
