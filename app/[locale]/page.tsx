import type { Metadata } from 'next';
import { SEED as INITIAL_CAROUSEL } from '@/app/api/home/carousel/data';
import HomeClient from './HomeClient';
import { buildWebsiteJsonLd } from './_components/home/home-seo';
import { homeMetadata } from '@/app/[locale]/_seo/page-metadata';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return homeMetadata(params.locale);
}

export default function Page() {
  const jsonLd = buildWebsiteJsonLd();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeClient initialCarousel={INITIAL_CAROUSEL} />
    </>
  );
}
