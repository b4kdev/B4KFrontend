// Feature switches read from the environment (inlined at build time, same value on server and client).

/** Badges, leaderboard and their profile, settings and notification parts. Off unless set to 'on'. */
export const GAMIFICATION = process.env.NEXT_PUBLIC_GAMIFICATION === 'on'

/** Whether a notification type shows: badge and challenge notifications stay hidden with gamification
 * off. The rail bell's count, the list and its empty state all go by this. */
export const notificationShown = (type: string) => GAMIFICATION || (type !== 'badge_earned' && type !== 'challenge_new')

/** Locate me on the map (the browser location and the location dot). Off unless set to 'on': it
 * waits on the legal steps for location-based services in Korea. */
export const LOCATE_ME = process.env.NEXT_PUBLIC_LOCATE_ME === 'on'

/** Sponsored partner packages on the Explore category pages. Off unless set to 'on': the row is
 * built but stays hidden at launch, even when the API sends packages. */
export const PACKAGES = process.env.NEXT_PUBLIC_PACKAGES === 'on'
