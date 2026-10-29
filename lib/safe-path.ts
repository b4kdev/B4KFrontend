/** A redirect target from a URL or request, kept only if it is a path on this site (guards against open redirect). */
export const safePath = (target: unknown): string => {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return '/'
  // Browsers drop tabs and line breaks from a URL, so '/<tab>/host' would become '//host'.
  if (/[\u0000-\u001f\u007f]/.test(target)) return '/'
  // Resolved against a stand-in origin, a path on this site keeps that origin.
  const base = 'http://same.invalid'
  try {
    const url = new URL(target, base)
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : '/'
  } catch {
    return '/'
  }
}
