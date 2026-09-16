import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/db'

type AuthValue = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

const PRESENCE_INTERVAL = 60_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const userId = session?.user.id ?? null
  const heartbeat = useRef<number | undefined>(undefined)

  const loadProfile = useCallback(async (id: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    setProfile((data as Profile | null) ?? null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    loadProfile(userId).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [userId, loadProfile])

  // Keep presence honest: a heartbeat while the tab is alive, and a best
  // effort "gone" when it is hidden or closed.
  useEffect(() => {
    if (!userId) return

    const beat = (online: boolean) => supabase.rpc('touch_presence', { online })
    beat(true)
    heartbeat.current = window.setInterval(() => {
      if (document.visibilityState === 'visible') beat(true)
    }, PRESENCE_INTERVAL)

    const onHidden = () => {
      if (document.visibilityState === 'hidden') beat(false)
      else beat(true)
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', () => beat(false))

    return () => {
      window.clearInterval(heartbeat.current)
      document.removeEventListener('visibilitychange', onHidden)
      beat(false)
    }
  }, [userId])

  const value = useMemo<AuthValue>(
    () => ({
      session,
      profile,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      async signUp(email, password, username) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, display_name: username } },
        })
        if (error) throw error
      },
      async signOut() {
        await supabase.rpc('touch_presence', { online: false })
        await supabase.auth.signOut()
      },
      async refreshProfile() {
        if (userId) await loadProfile(userId)
      },
    }),
    [session, profile, loading, userId, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
