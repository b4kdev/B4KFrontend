/** Home's content sections in the drawn order (the hero stays pinned above them). */
export const HOME_SECTION_ORDER: string[] = ['exploreHub', 'trending', 'planningCue', 'interests', 'events', 'popularPlans']

export interface HomeSectionOrder {
  order: string[]
}
