// v2 texts for one locale, in order of trust:
// 1. the Copy Deck row approved for the locale (messages/v2/{locale}.json), unless it is just the
//    English copied in;
// 2. the supplement (messages/v2/supplement/{locale}.json): translations of rows the deck has not
//    translated yet, to be reviewed into the deck, and the `gap` texts that have no deck row;
// 3. the English row.
// A deck row that matches English on purpose (names such as K-Pop) has no supplement entry and
// stays as it is.

type Texts = Record<string, string>

export function mergeCd(en: Texts, deck: Texts = {}, supplement: Texts = {}): Texts {
  const out: Texts = {}
  for (const [id, source] of Object.entries(en)) {
    const approved = deck[id]
    out[id] = approved !== undefined && approved !== source ? approved : supplement[id] ?? approved ?? source
  }
  return out
}

export function mergeGap(en: Texts = {}, supplement: Texts = {}): Texts {
  return { ...en, ...supplement }
}
