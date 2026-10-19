import { getTranslations } from 'next-intl/server';

// FAQ structured data for /help (live HelpClient and the v2 Help screen show the same questions).
const SECTIONS = ['getting-started', 'planning', 'saved', 'account', 'technical'] as const;
const ITEMS = ['q1', 'q2', 'q3'] as const;

export async function buildFaqJsonLd(locale: string) {
  const t = await getTranslations({ locale, namespace: 'help' });
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SECTIONS.flatMap((slug) =>
      ITEMS.map((item) => ({
        '@type': 'Question',
        name: t(`sections.${slug}.items.${item}.q`),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t(`sections.${slug}.items.${item}.a`),
        },
      }))
    ),
  };
}
