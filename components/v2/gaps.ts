// Texts the preview screens need that the Copy Deck (DOC-197) does not have yet. English
// placeholders only: each one becomes a new design-only row in the deck (2nd review), then the
// screen switches to t('CDxxxx') and the line here goes.
export const GAP = {
  breadcrumb: 'Breadcrumb',
  lastUpdated: (date: string) => `Last updated ${date}`,
  newTab: '(opens in a new tab)',
  // Transport mode Estimate label (Figma "About · 15 min"; CD has no row).
  about: 'About',
  mapError: "The map couldn't load. Check your connection, then try again.",
  // Parameterized versions of design rows that carry sample values in the deck:
  addedToDay: (day: number) => `Added to Day ${day}`, // CD-1579 "Added to Day 1"
  discardBody: (n: number) => `The ${n} stops in your plan in progress will be removed. This cannot be undone.`, // CD-1537
  viewOnPartner: (partner: string) => `View on ${partner}`, // CD-1342 "View on Klook"
  noCategoryTrending: (category: string) => `No ${category} places are trending yet`, // CD-1569
} as const
