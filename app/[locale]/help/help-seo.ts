import { createTranslator } from 'next-intl';
import { mergeCd } from '@/components/v2/messages';
import { HELP_TOPICS } from '@/components/v2/help';
import enV2 from '@/messages/v2/en.json';

// FAQ structured data for /help. It reads the same Copy Deck rows and the same shown questions as
// the v2 Help screen, so the questions and answers cannot drift from what the page offers.
export async function buildFaqJsonLd(locale: string) {
  const load = (name: string): Promise<{ cd?: Record<string, string> }> =>
    import(`@/messages/v2/${name}.json`).then((m) => m.default).catch(() => ({}));
  const [deck, supplement] = await Promise.all([load(locale), load(`supplement/${locale}`)]);
  const cd = createTranslator({ locale, messages: { cd: mergeCd(enV2.cd, deck.cd, supplement.cd) }, namespace: 'cd' });
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HELP_TOPICS.flatMap((topic) =>
      topic.questions.map((q) => ({
        '@type': 'Question',
        name: cd(q.q),
        acceptedAnswer: {
          '@type': 'Answer',
          text: cd(q.a),
        },
      }))
    ),
  };
}
