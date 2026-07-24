import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { hreflangAlternates, localizedUrl } from '@/lib/site-url';
import { LegalDocument } from '@/components/legal/LegalDocument';
import {
  privacyPolicySections,
  privacyPolicyLastUpdated,
  privacyPolicyContactEmail,
} from '@/content/legal/privacy-policy-content';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'routes.legalPrivacy' });
  const title = `${t('title')} | B4K`;
  const description = t('empty.desc');
  const url = localizedUrl(params.locale, '/legal/privacy');
  return {
    title,
    description,
    alternates: { canonical: url, languages: hreflangAlternates('/legal/privacy') },
    openGraph: { title, description, url, siteName: 'B4K', locale: params.locale, type: 'article' },
  };
}

export default function Page() {
  const t = useTranslations('routes.legalPrivacy');

  return (
    <div className="px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-16 max-w-[1200px] mx-auto" aria-label={t('title')}>
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg">B4K</Link>

        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>
      <h1 className="text-fg font-display text-f-display-tile mb-sp-6">{t('title')}</h1>
      <LegalDocument
        lastUpdated={privacyPolicyLastUpdated}
        contactEmail={privacyPolicyContactEmail}
        sections={privacyPolicySections}
      />
    </div>
  );
}
