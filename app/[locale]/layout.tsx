import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { routing } from '@/i18n/routing';
import ShellClient from './_shell/ShellClient';

const MockToggle = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('@/components/dev/MockToggle'), { ssr: false })
  : null

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ShellClient>{children}</ShellClient>
      {MockToggle && <MockToggle />}
    </NextIntlClientProvider>
  );
}
