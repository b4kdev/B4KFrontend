import type { ReactNode } from 'react';

export type LegalSection = {
  id: string;
  heading: string;
  body: ReactNode;
};

export function LegalDocument({
  lastUpdated,
  contactEmail,
  sections,
}: {
  lastUpdated: string;
  contactEmail: string;
  sections: LegalSection[];
}) {
  return (
    <div className="max-w-[720px]">
      <p className="text-f-sm text-muted mb-sp-8">
        Last updated: {lastUpdated} · Contact:{' '}
        <a href={`mailto:${contactEmail}`} className="text-lav hover:underline">
          {contactEmail}
        </a>
      </p>
      {sections.map((section, index) => (
        <section key={section.id} className={index === 0 ? 'mt-0' : 'mt-sp-8'}>
          {index > 0 && <div style={{ borderTop: 'var(--bdr)' }} className="mb-sp-8" />}
          <h2 className="text-fg font-display text-f-lg font-semibold mb-sp-3">{section.heading}</h2>
          <div className="text-f-base text-muted leading-relaxed [&_p]:mb-sp-4 [&_ul]:list-disc [&_ul]:pl-sp-5 [&_ul]:mb-sp-4 [&_ul]:space-y-1 [&_li]:mb-0 [&_strong]:text-fg [&_strong]:font-semibold [&_a]:text-lav [&_a:hover]:underline [&_h3]:text-fg [&_h3]:font-semibold [&_h3]:text-f-base [&_h3]:mt-sp-5 [&_h3]:mb-sp-2 [&_table]:w-full [&_th]:text-left [&_th]:text-fg [&_th]:font-semibold [&_th]:py-sp-2 [&_th]:pr-sp-4 [&_td]:py-sp-2 [&_td]:pr-sp-4 [&_td]:align-top">
            {section.body}
          </div>
        </section>
      ))}
    </div>
  );
}
