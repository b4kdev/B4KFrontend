// A signed-in action the server answers with 401: the session has ended (expired or signed out
// elsewhere). The screens' fetch helpers report it here; the v2 shell listens and opens the sign-in
// gate over the page, so the visitor signs in and carries on where they were.

export const SESSION_EXPIRED_EVENT = 'b4k:session-expired'

/** The error a screen's fetch helper throws for a failed response; a 401 also opens sign-in. */
export function httpError(status: number): Error {
  if (status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  return new Error(String(status))
}
