// Feature switches read from the environment (inlined at build time, same value on server and client).

/** Badges, leaderboard and their profile, settings and notification parts. Off unless set to 'on'. */
export const GAMIFICATION = process.env.NEXT_PUBLIC_GAMIFICATION === 'on'
