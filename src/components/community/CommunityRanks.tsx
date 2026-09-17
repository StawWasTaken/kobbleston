import { useState } from 'react'
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/useAsync'
import { deleteCommunityRank, listCommunityRanks, saveCommunityRank } from '@/lib/api'
import type { CommunityRank } from '@/types/db'

const permissions: { key: keyof CommunityRank; label: string }[] = [
  { key: 'can_post_wall', label: 'Post on the wall' },
  { key: 'can_moderate_wall', label: 'Moderate the wall' },
  { key: 'can_manage_members', label: 'Manage members' },
  { key: 'can_manage_ranks', label: 'Manage ranks' },
  { key: 'can_manage_community', label: 'Edit the Community' },
  { key: 'can_manage_spaces', label: 'Manage linked Spaces' },
]

/** Ranks run from 1 to 254, and permissions hang off the rank. */
export function CommunityRanks({ communityId }: { communityId: string }) {
  const toast = useToast()
  const ranks = useAsync(() => listCommunityRanks(communityId), [communityId])
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [pending, setPending] = useState(false)

  const guard = async (run: () => Promise<void>) => {
    try {
      await run()
      ranks.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    }
  }

  const add = async () => {
    const rank = Number(number)
    if (!name.trim() || !Number.isInteger(rank) || rank < 1 || rank > 254) {
      toast('A rank needs a name and a number from 1 to 254.', 'error')
      return
    }
    setPending(true)
    await guard(async () => {
      await saveCommunityRank({ community_id: communityId, name: name.trim(), rank })
      setName('')
      setNumber('')
    })
    setPending(false)
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <Input
          label="New rank"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
          placeholder="Moderator"
          className="min-w-40 flex-1"
        />
        <Input
          label="Number"
          type="number"
          min={1}
          max={254}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="100"
          className="w-28"
        />
        <Button icon={faPlus} loading={pending} onClick={add}>Add</Button>
      </Card>

      {ranks.loading && <Skeleton className="h-32" />}

      {ranks.data?.map((rank) => (
        <Card key={rank.id} className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-deep font-display text-sm font-extrabold">
              {rank.rank}
            </span>
            <input
              value={rank.name}
              onChange={(e) =>
                guard(() => saveCommunityRank({
                  id: rank.id, community_id: communityId, name: e.target.value,
                }))
              }
              maxLength={32}
              aria-label={`Name of rank ${rank.rank}`}
              className="h-9 min-w-40 flex-1 rounded-lg border border-ink-line bg-ink-raised px-3 text-sm font-bold focus:border-brand-bright"
            />
            {rank.rank !== 254 && (
              <Button
                size="sm"
                variant="ghost"
                icon={faTrash}
                aria-label={`Delete the ${rank.name} rank`}
                onClick={() => guard(() => deleteCommunityRank(rank.id))}
              />
            )}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {permissions.map((permission) => (
              <label
                key={permission.key}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink-line bg-ink-raised px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={Boolean(rank[permission.key])}
                  disabled={rank.rank === 254}
                  onChange={(e) =>
                    guard(() => saveCommunityRank({
                      id: rank.id,
                      community_id: communityId,
                      [permission.key]: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#1B34E8]"
                />
                <span className="text-white/75">{permission.label}</span>
              </label>
            ))}
          </div>

          {rank.rank === 254 && (
            <p className="mt-2 text-xs text-muted">
              The top rank always has everything. That is what makes it the top rank.
            </p>
          )}
        </Card>
      ))}
    </div>
  )
}
