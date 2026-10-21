/** A redirect target from a URL or request, kept only if it is a path on this site (guards against open redirect). */
export const safePath = (target: unknown): string =>
  typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\') ? target : '/'
