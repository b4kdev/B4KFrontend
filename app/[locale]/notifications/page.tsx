import type { Metadata } from 'next';
import NotificationsClient from './NotificationsClient';
import { notificationsMetadata } from '@/app/[locale]/_seo/page-metadata';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return notificationsMetadata(params.locale);
}

export default function Page() {
  return <NotificationsClient />;
}
