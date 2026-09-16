import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/api'
import { randomAvatar } from '@/lib/avatars'
import type { Profile } from '@/types/db'

type AuthValue = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (details: SignupDetails) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export type SignupDetails = {
  email: string
  password: string
  username: string
  displayName: string
  avatarFile: File | null
  birthDate: string
  gender: string
}

const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

const PRESENCE_INTERVAL = 60_000

/** Held when signup could not upload yet because no session existed. */
let pendingAvatar: File | null = null

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

    const run = async () => {
      if (pendingAvatar) {
        const file = pendingAvatar
        pendingAvatar = null
        try {
          const url = await uploadAvatar(userId, file)
          await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
        } catch {
          // Not worth blocking sign-in over; the picture can be set later.
        }
      }
      await loadProfile(userId)
    }

    run().finally(() => {
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
      async signUp(details) {
        const { data, error } = await supabase.auth.signUp({
          email: details.email,
          password: details.password,
          options: {
            data: {
              username: details.username,
              display_name: details.displayName || details.username,
              // No upload means one of the Kobby pictures, decided here so
              // the account always has one.
              avatar_url: details.avatarFile ? '' : randomAvatar(),
              birth_date: details.birthDate,
              gender: details.gender,
            },
          },
        })
        if (error) throw error

        // Storage needs a signed-in user. When the project asks for email
        // confirmation there is no session yet, so the picture is set on the
        // first sign-in instead and a Kobby picture stands in until then.
        if (details.avatarFile && data.session) {
          const url = await uploadAvatar(data.session.user.id, details.avatarFile)
          await supabase.from('profiles').update({ avatar_url: url }).eq('id', data.session.user.id)
        } else if (details.avatarFile) {
          pendingAvatar = details.avatarFile
        }
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
