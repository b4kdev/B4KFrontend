import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { LegalDocument } from '@/components/legal/LegalDocument';
import {
  cookiePolicySections,
  cookiePolicyLastUpdated,
  cookiePolicyContactEmail,
} from '@/content/legal/cookie-policy-content';
import CookiePreferences from './_CookiePreferences';
import { getTranslations } from 'next-intl/server';
import { legalMetadata } from '@/app/[locale]/_seo/page-metadata';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return legalMetadata('cookies', params.locale);
}

export default async function Page({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'routes.legalCookies' });

  return (
    <div className="px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-16 max-w-[1200px] mx-auto" aria-label={t('title')}>
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>
      <h1 className="text-fg font-display text-f-display-tile mb-sp-6">{t('title')}</h1>
      <LegalDocument
        lastUpdated={cookiePolicyLastUpdated}
        contactEmail={cookiePolicyContactEmail}
        sections={cookiePolicySections}
      />
      <div className="max-w-[720px] mt-sp-8">
        <div style={{ borderTop: 'var(--bdr)' }} className="mb-sp-8" />
        <h2 className="text-fg font-display text-f-lg font-semibold mb-sp-3">Manage Your Preferences</h2>
        <CookiePreferences />
      </div>
    </div>
  );
}
