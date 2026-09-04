export function getDisplayName(obj: {
  name_preferred?: string | null;
  name_en?: string | null;
  name_ko?: string | null;
  id?: string | number;
}, locale?: string): string {
  if (obj.name_preferred) return obj.name_preferred;
  return locale === 'ko'
    ? obj.name_ko ?? obj.name_en ?? String(obj.id ?? '')
    : obj.name_en ?? obj.name_ko ?? String(obj.id ?? '');
}
