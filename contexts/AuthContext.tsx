'use client'
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useLocale } from 'next-intl'
import { Session, User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { track } from '@/lib/analytics'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
})

// Module-level singleton — created once, stable across all renders
const supabase = createSupabaseBrowserClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const locale = useLocale()
  const localeRef = useRef(locale)
  localeRef.current = locale

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only SIGNED_IN is a real sign-in action — INITIAL_SESSION fires on every page
      // load for an already-logged-in user, TOKEN_REFRESHED/USER_UPDATED aren't sign-ins.
      if (event === 'SIGNED_IN' && session?.user) {
        const { created_at, last_sign_in_at } = session.user
        const isNewUser = !!created_at && !!last_sign_in_at &&
          Math.abs(new Date(last_sign_in_at).getTime() - new Date(created_at).getTime()) < 5000
        track('sign_in', {
          method: session.user.app_metadata?.provider ?? 'email',
          is_new_user: isNewUser,
          locale: localeRef.current,
          screen_id: 'AG_01',
        })
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
