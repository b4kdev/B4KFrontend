import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { hreflangAlternates, localizedUrl } from '@/lib/site-url';
import HelpClient from './HelpClient';

const SECTIONS = ['getting-started', 'planning', 'saved', 'account', 'technical'] as const;
const ITEMS = ['q1', 'q2', 'q3'] as const;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'help' });
  const tRoutes = await getTranslations({ locale: params.locale, namespace: 'routes.help' });
  const title = `${t('title')} | B4K`;
  const description = tRoutes('empty.desc');
  const url = localizedUrl(params.locale, '/help');
  return {
    title,
    description,
    alternates: { canonical: url, languages: hreflangAlternates('/help') },
    openGraph: { title, description, url, siteName: 'B4K', locale: params.locale, type: 'website' },
  };
}

async function buildFaqJsonLd(locale: string) {
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

export default async function Page({ params }: { params: { locale: string } }) {
  const jsonLd = await buildFaqJsonLd(params.locale);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HelpClient />
    </>
  );
}
