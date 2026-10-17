// Texts the preview screens need that the Copy Deck (DOC-197) does not have yet. English
// placeholders only: each one becomes a new design-only row in the deck (2nd review), then the
// screen switches to t('CDxxxx') and the line here goes.
export const GAP = {
  breadcrumb: 'Breadcrumb',
  lastUpdated: (date: string) => `Last updated ${date}`,
} as const
