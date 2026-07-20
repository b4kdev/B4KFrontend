import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { hreflangAlternates, localizedUrl } from '@/lib/site-url';
import NotificationsClient from './NotificationsClient';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'notifications' });
  const title = `${t('title')} | B4K`;
  const description = t('empty.desc');
  const url = localizedUrl(params.locale, '/notifications');
  return {
    title,
    description,
    alternates: { canonical: url, languages: hreflangAlternates('/notifications') },
    openGraph: { title, description, url, siteName: 'B4K', locale: params.locale, type: 'website' },
  };
}

export default function Page() {
  return <NotificationsClient />;
}
