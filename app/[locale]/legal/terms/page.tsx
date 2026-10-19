import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { termsSections, termsLastUpdated, termsContactEmail } from '@/content/legal/terms-content';
import { legalMetadata } from '@/app/[locale]/_seo/page-metadata';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return legalMetadata('terms', params.locale);
}

export default function Page() {
  const t = useTranslations('routes.legalTerms');

  return (
    <div className="px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-16 max-w-[1200px] mx-auto" aria-label={t('title')}>
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg">B4K</Link>

        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>
      <h1 className="text-fg font-display text-f-display-tile mb-sp-6">{t('title')}</h1>
      <LegalDocument lastUpdated={termsLastUpdated} contactEmail={termsContactEmail} sections={termsSections} />
    </div>
  );
}
