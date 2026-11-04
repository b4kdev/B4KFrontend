import { permanentRedirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

export default async function Page() {
  const locale = await getLocale();
  permanentRedirect(`/${locale}/map?ai=open`);
}
