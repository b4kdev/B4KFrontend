import { createTranslator } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { mergeCd } from '@/components/v2/messages';
import enV2 from '@/messages/v2/en.json';
import keys from '@/messages/v2/keys.json';

// FAQ structured data for /help. It reads the same Copy Deck rows as the v2 Help screen (each live
// key through its Copy Deck id), so the questions and answers cannot drift from what the page shows.
const SECTIONS = ['getting-started', 'planning', 'saved', 'account', 'technical'] as const;
const ITEMS = ['q1', 'q2', 'q3'] as const;
const KEY_TO_CD = keys as Record<string, string>;

export async function buildFaqJsonLd(locale: string) {
  const load = (name: string): Promise<{ cd?: Record<string, string> }> =>
    import(`@/messages/v2/${name}.json`).then((m) => m.default).catch(() => ({}));
  const [deck, supplement] = await Promise.all([load(locale), load(`supplement/${locale}`)]);
  const cd = createTranslator({ locale, messages: { cd: mergeCd(enV2.cd, deck.cd, supplement.cd) }, namespace: 'cd' });
  // A key without a Copy Deck row keeps its old text, as the screen would show the key otherwise.
  const old = await getTranslations({ locale, namespace: 'help' });
  const text = (key: string) => (KEY_TO_CD[`help.${key}`] ? cd(KEY_TO_CD[`help.${key}`]) : old(key));
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SECTIONS.flatMap((slug) =>
      ITEMS.map((item) => ({
        '@type': 'Question',
        name: text(`sections.${slug}.items.${item}.q`),
        acceptedAnswer: {
          '@type': 'Answer',
          text: text(`sections.${slug}.items.${item}.a`),
        },
      }))
    ),
  };
}
