import { routing } from '@/i18n/routing'
import { buildLlmsTxt, llmsResponse } from '@/lib/llms'

export const revalidate = 3600

export async function GET() {
  return llmsResponse(await buildLlmsTxt(routing.defaultLocale))
}
