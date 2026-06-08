export function getDisplayName(obj: {
  name_preferred?: string | null;
  name_en?: string | null;
  name_ko?: string | null;
  id?: string | number;
}): string {
  return obj.name_preferred ?? obj.name_en ?? obj.name_ko ?? String(obj.id ?? '');
}
