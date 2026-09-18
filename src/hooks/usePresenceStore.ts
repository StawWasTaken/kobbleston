import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase'
import type { Presence } from '@/components/ui/StatusDot'
import { presenceOf } from '@/components/ui/StatusDot'

/*
 * Who is here, right now, kept in one place for the whole tab.
 *
 * A row fetched by a page is a photograph: it says what somebody was doing
 * when that page happened to ask, and it never changes afterwards, which is
 * why the same person could be Building in the sidebar and Online on their
 * profile and neither would move.
 *
 * So presence stops coming from rows. Everybody with Kobbleston open joins one
 * channel and says what they are doing; everybody subscribed hears it the
 * moment it changes. A row is only the fallback, for people who are not here
 * to speak for themselves.
 */
export type Here = {
  id: string
  activity: 'around' | 'building'
  in_space_id: string | null
  at: number
}

const here = new Map<string, Here>()
const watchers = new Set<() => void>()
let version = 0

function changed() {
  version += 1
  for (const tell of watchers) tell()
}

function subscribe(tell: () => void) {
  watchers.add(tell)
  return () => { watchers.delete(tell) }
}

/** Anything that reads presence re-reads it when this moves. */
const useVersion = () => useSyncExternalStore(subscribe, () => version, () => version)

/**
 * The state of one person: what they are saying about themselves if they are
 * here, and what their row last said if they are not.
 */
export function useLivePresence(person?: {
  id?: string
  is_online?: boolean
  in_space_id?: string | null
  activity?: string | null
  last_seen_at?: string | null
} | null): Presence {
  useVersion()

  const live = person?.id ? here.get(person.id) : undefined
  if (live) {
    return live.in_space_id ? 'in-space' : live.activity === 'building' ? 'building' : 'online'
  }

  return presenceOf(person)
}

/*
 * The one channel, joined once by the page frame.
 *
 * Presence here is Supabase's own: no table, no rows, no writes. It is a list
 * of who is connected and what each of them last said, and it empties itself
 * when somebody closes the tab, which is the one thing a heartbeat into a
 * table can never do properly.
 */
export function usePresenceChannel(
  me: string | undefined,
  doing: 'around' | 'building',
  inSpace: string | null | undefined,
) {
  useEffect(() => {
    const channel = supabase.channel('kobbleston:here', {
      config: { presence: { key: me ?? `guest-${Math.random().toString(36).slice(2)}` } },
    })

    const read = () => {
      const state = channel.presenceState<Here>()
      here.clear()
      for (const list of Object.values(state)) {
        for (const one of list) {
          if (one?.id) here.set(one.id, one)
        }
      }
      changed()
    }

    channel
      .on('presence', { event: 'sync' }, read)
      .on('presence', { event: 'join' }, read)
      .on('presence', { event: 'leave' }, read)
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED' || !me) return
        void channel.track({ id: me, activity: doing, in_space_id: inSpace ?? null, at: Date.now() })
      })

    return () => {
      void supabase.removeChannel(channel)
      here.clear()
      changed()
    }
  }, [me])

  // Saying it again when what you are doing changes, without rejoining.
  useEffect(() => {
    if (!me) return
    const channel = supabase.getChannels().find((one) => one.topic === 'realtime:kobbleston:here')
    if (!channel) return
    void channel.track({ id: me, activity: doing, in_space_id: inSpace ?? null, at: Date.now() })
  }, [me, doing, inSpace])

  /*
   * Nobody sends a message to say they have gone quiet, so the clock has to
   * be looked at now and then: somebody whose row went stale becomes grey
   * without anything arriving to tell us.
   */
  useEffect(() => {
    const timer = window.setInterval(changed, 30_000)
    return () => window.clearInterval(timer)
  }, [])
}
