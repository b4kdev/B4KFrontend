import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { headers } from 'next/headers'
import { getMessages } from 'next-intl/server'
import en from '@/messages/v2/en.json'
import V2Shell from '@/components/v2/V2Shell'
import { keepKNamesDeep } from '@/components/v2/text'
import { V2_LIVE_HEADER } from '@/lib/v2-live'
import '@/components/v2/v2.css'

// Preview of the new design (PD-53 update 2): every Figma screen under /[locale]/v2, built from
// components/library. Hidden: noindex, not linked from live pages. Texts come from the Copy Deck
// (messages/v2, `cd` namespace); untranslated rows fall back to English.
// Areas listed in lib/v2-live.ts are served here from their live address (middleware rewrite);
// those keep the live site's metadata instead of the preview's.
export async function generateMetadata(): Promise<Metadata> {
  if (headers().get(V2_LIVE_HEADER)) return {}
  return {
    title: 'B4K preview',
    robots: { index: false, follow: false, nocache: true },
  }
}

export default async function V2Layout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const base = await getMessages()
  let local: { cd: Record<string, string> } = { cd: {} }
  try {
    local = (await import(`@/messages/v2/${params.locale}.json`)).default
  } catch {
    // locale without v2 texts yet: English only
  }
  return (
    <NextIntlClientProvider locale={params.locale} messages={{ ...base, cd: keepKNamesDeep({ ...en.cd, ...local.cd }) }}>
      <V2Shell>{children}</V2Shell>
    </NextIntlClientProvider>
  )
}
