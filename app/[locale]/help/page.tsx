import type { Metadata } from 'next';
import HelpClient from './HelpClient';
import { buildFaqJsonLd } from './help-seo';
import { helpMetadata } from '@/app/[locale]/_seo/page-metadata';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return helpMetadata(params.locale);
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
