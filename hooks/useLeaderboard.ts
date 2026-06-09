import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { LeaderboardData, LeaderboardWindow } from '@/app/api/leaderboard/route'

export function useLeaderboard(window: LeaderboardWindow) {
  const { data, error, isLoading, mutate } = useSWR<LeaderboardData>(
    `/api/leaderboard?window=${window}`, fetcher, { revalidateOnFocus: false }
  )
  return { data, isLoading, isError: !!error, mutate }
}
