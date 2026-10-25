import { routing } from '@/i18n/routing'
import { buildLlmsTxt, llmsResponse } from '@/lib/llms'

export const revalidate = 3600

export function generateStaticParams() {
  return routing.locales.filter((locale) => locale !== routing.defaultLocale).map((locale) => ({ locale }))
}

// /en/llms.txt is the same file as /llms.txt; other unknown locales are not found.
export async function GET(_req: Request, { params }: { params: { locale: string } }) {
  if (!(routing.locales as readonly string[]).includes(params.locale)) return new Response('Not found', { status: 404 })
  return llmsResponse(await buildLlmsTxt(params.locale))
}
