import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { headers } from 'next/headers'
import { getMessages } from 'next-intl/server'
import en from '@/messages/v2/en.json'
import V2Shell from '@/components/v2/V2Shell'
import { mergeCd, mergeGap } from '@/components/v2/messages'
import { keepKNamesDeep } from '@/components/v2/text'
import { V2_LIVE_HEADER } from '@/lib/v2-live'

// Preview of the new design: every Figma screen under /[locale]/v2, built from
// components/library. Hidden: noindex, not linked from live pages. Texts come from the Copy Deck
// (messages/v2, `cd` namespace) with the supplement for rows not translated yet and texts with no
// row (`gap`); see components/v2/messages.ts.
// Areas listed in lib/v2-live.ts are served here from their live address (middleware rewrite);
// those keep the live site's metadata instead of the preview's.
export async function generateMetadata(): Promise<Metadata> {
  if (headers().get(V2_LIVE_HEADER)) return {}
  // The preview address itself (/[locale]/v2/...) redirects to the live one; whatever is still
  // served here stays out of search results and keeps the site title.
  return {
    robots: { index: false, follow: false, nocache: true },
  }
}

export default async function V2Layout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const base = await getMessages()
  // A locale without a file yet gets the English texts.
  const load = (name: string): Promise<{ cd?: Record<string, string>; gap?: Record<string, string> }> =>
    import(`@/messages/v2/${name}.json`).then((m) => m.default).catch(() => ({}))
  const [deck, supplement, supplementEn] = await Promise.all([
    load(params.locale),
    load(`supplement/${params.locale}`),
    load('supplement/en'),
  ])
  const messages = {
    ...base,
    cd: keepKNamesDeep(mergeCd(en.cd, deck.cd, supplement.cd)),
    gap: keepKNamesDeep(mergeGap(supplementEn.gap, supplement.gap)),
  }
  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <V2Shell>{children}</V2Shell>
    </NextIntlClientProvider>
  )
}
