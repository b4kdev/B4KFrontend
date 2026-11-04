// Password rule, the same as the Supabase Auth setting: 8 or more characters with lowercase and
// uppercase letters, a number and a symbol. Checked in the browser while typing and again in the
// API routes, so a weak password gets its reason instead of a generic failure.

// The symbols Supabase counts for "symbols" in its password requirements.
const SYMBOL = /[!@#$%^&*()_+\-=[\]{};':"|<>?,./`~]/

export const PASSWORD_MIN = 8

/** 'short' under 8 characters, 'weak' when a kind of character is missing, null when it passes. */
export function passwordProblem(pw: string): 'short' | 'weak' | null {
  if (pw.length < PASSWORD_MIN) return 'short'
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw) || !SYMBOL.test(pw)) return 'weak'
  return null
}

/** Error code the auth routes answer for a password Supabase or the rule refuses. */
export const WEAK_PASSWORD = 'weak_password'

/** True when a Supabase Auth error is its weak-password refusal. */
export function isWeakPasswordError(e: { code?: string; message?: string } | null | undefined): boolean {
  return !!e && (e.code === WEAK_PASSWORD || /weak|password should/i.test(e.message ?? ''))
}
