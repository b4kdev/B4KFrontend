import { ArrowRight } from 'lucide-react';

interface SectionHeadProps {
  title: string;
  subtitle?: string;
  seeAllLabel: string;
  onSeeAll?: () => void;
}

export default function SectionHead({ title, subtitle, seeAllLabel, onSeeAll }: SectionHeadProps) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-[16px] font-extrabold tracking-[0.04em] uppercase text-fg mb-1 font-display">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] text-muted leading-[1.5]">{subtitle}</p>
        )}
      </div>
      <button
        onClick={onSeeAll}
        className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-muted hover:text-fg transition-colors whitespace-nowrap shrink-0 cursor-pointer bg-transparent border-none font-body"
      >
        {seeAllLabel}
        <ArrowRight size={12} strokeWidth={2} />
      </button>
    </div>
  );
}
