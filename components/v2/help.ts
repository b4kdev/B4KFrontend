// Help center content, shared by the Help screen and the FAQ structured data (server and client).
// Every question and answer is a Copy Deck row; the drawn topics and their order.

export type HelpQuestion = { id: string; q: string; a: string }
export type HelpTopic = { slug: string; title: string; questions: HelpQuestion[] }

// Questions off at launch: the feature they describe is hidden or not built yet (report, moving a
// place to another list, sending feedback in the app, place problem reports, data download).
// The page and the structured data never list them.
const HIDDEN = new Set(['report-plan', 'after-report', 'move-place', 'send-feedback', 'wrong-details', 'data-copy'])

const ALL_TOPICS: HelpTopic[] = [
  {
    slug: 'getting-started',
    title: 'CD0352',
    questions: [
      { id: 'what-is-b4k', q: 'CD0347', a: 'CD0346' },
      { id: 'need-account', q: 'CD1708', a: 'CD0355' },
      { id: 'languages', q: 'CD1709', a: 'CD0350' },
      { id: 'free', q: 'CD1710', a: 'CD1841' },
    ],
  },
  {
    slug: 'map',
    title: 'CD1699',
    questions: [
      { id: 'find-places', q: 'CD1711', a: 'CD1842' },
      { id: 'pins', q: 'CD1712', a: 'CD1843' },
      { id: 'wrong-details', q: 'CD1713', a: 'CD1844' },
      { id: 'no-photo', q: 'CD1714', a: 'CD1845' },
      { id: 'save-place', q: 'CD0373', a: 'CD0372' },
    ],
  },
  {
    slug: 'planning',
    title: 'CD0371',
    questions: [
      { id: 'make-plan', q: 'CD1715', a: 'CD0365' },
      { id: 'quick-plan', q: 'CD1716', a: 'CD1846' },
      { id: 'plan-from-saved', q: 'CD1717', a: 'CD0376' },
      { id: 'stops', q: 'CD1718', a: 'CD0369' },
      { id: 'plan-as-guest', q: 'CD1719', a: 'CD0367' },
      { id: 'share-plan', q: 'CD1436', a: 'CD1437' },
    ],
  },
  {
    slug: 'saved',
    title: 'CD1700',
    questions: [
      { id: 'lists', q: 'CD0375', a: 'CD0374' },
      { id: 'move-place', q: 'CD1720', a: '' },
      { id: 'my-plans', q: 'CD1721', a: 'CD1847' },
      { id: 'who-sees-saved', q: 'CD1722', a: 'CD1848' },
    ],
  },
  {
    slug: 'account',
    title: 'CD1701',
    questions: [
      { id: 'delete-account', q: 'CD0334', a: 'CD0333' },
      { id: 'password', q: 'CD0336', a: 'CD0335' },
      { id: 'display-name', q: 'CD1723', a: 'CD1849' },
      { id: 'language-theme', q: 'CD1724', a: 'CD1850' },
      { id: 'cancel-delete', q: 'CD1725', a: 'CD1851' },
      { id: 'data-copy', q: 'CD1726', a: 'CD1852' },
    ],
  },
  {
    slug: 'reporting',
    title: 'CD1702',
    questions: [
      { id: 'report-plan', q: 'CD1727', a: 'CD1853' },
      { id: 'after-report', q: 'CD1728', a: 'CD1854' },
      { id: 'send-feedback', q: 'CD1729', a: 'CD0383' },
    ],
  },
]

/** Topics with their shown questions; a topic with none left is not listed. */
export const HELP_TOPICS: HelpTopic[] = ALL_TOPICS.map((t) => ({ ...t, questions: t.questions.filter((q) => !HIDDEN.has(q.id)) })).filter((t) => t.questions.length)

/** Top questions as drawn, each opening its topic. */
export const HELP_TOP = ['make-plan', 'plan-as-guest', 'wrong-details', 'delete-account']
  .map((id) => HELP_TOPICS.flatMap((t) => t.questions.map((q) => ({ topic: t.slug, ...q }))).find((q) => q.id === id))
  .filter((q): q is HelpQuestion & { topic: string } => !!q)

export function helpTopic(slug: string | null | undefined): HelpTopic | undefined {
  return HELP_TOPICS.find((t) => t.slug === slug)
}
