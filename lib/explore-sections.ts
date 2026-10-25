// The rows of each Explore category (the API's sections), shared by the API and the pages that
// answer an unknown row with Page not found.

export const SECTIONS_BY_CATEGORY: Record<string, string[]> = {
  // 'agencies' renamed 'agencyHq' + 'memberFootsteps' added — CT_KP_EXT (DEC-60).
  // birthdayCafe intentionally excluded: it's conditionally rendered (see GET), not
  // a static per-category section like the rest.
  'k-pop': ['concerts', 'tours', 'agencyHq', 'merchandise', 'memberFootsteps'],
  'k-drama': ['filming', 'tours', 'historical', 'ostCafes'],
  // DEC-61 — restructured from skincare/makeup/spa/salon to the content plan's
  // real 4 rows (쇼핑·편집샵/브랜드플래그십/헤어·살롱/약국·더마). Existing real seed
  // items redistributed into whichever new row fits (see SEED_SECTIONS comment).
  'k-beauty': ['shopping', 'brandFlagship', 'salon', 'derma'],
  // DEC-61 — new 5th section. "기타" (509곳) explicitly skipped: the content plan
  // itself flags it as "로우로 못 쓰인다" (not usable as a row), not a screen gap.
  'k-food': ['noodles', 'soups', 'hanjeongsik'],
  // DEC-61 — restructured from traditional/food/festivals/crafts to the content
  // plan's real 4 rows (역사·유적/자연·경관/사찰·종교/박물관·미술관). Real items
  // redistributed, none dropped — see SEED_SECTIONS comment.
  'k-culture': ['heritage', 'nature', 'temple', 'museum'],
}

/** Rows a See all page can show: the category's sections and its Trending row. */
export function isExploreRow(category: string, row: string): boolean {
  const rows = SECTIONS_BY_CATEGORY[category]
  return !!rows && (rows.includes(row) || row === 'trending')
}
