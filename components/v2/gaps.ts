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
  editing: (title: string) => `Editing · ${title}`, // SCR-008 panel title (Figma, no CD row)
  editDraftBody: (n: number, title: string) => `The map has a plan in progress with ${n} stops. Save it or discard it before editing ${title}.`, // CD-1526
  createdBy: (name: string) => `Created by ${name}`, // CD-1483 "Created by Minji"
  deletePlanTitle: (title: string) => `Delete ${title}?`, // CD-1545
  planStats: (parts: string[]) => parts.join(' · '), // CD-1484 sample "5 stops · 2 days · 6h 30m · 6.2 km"
  days: (n: number) => (n === 1 ? '1 day' : `${n} days`), // CD-1484 part
  legLabel: (mode: string, time: string) => `${mode} · ${time}`, // CD-1538 to CD-1540
} as const
