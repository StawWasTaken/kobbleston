import { useState } from 'react'
import { faStar, faPenToSquare, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { EmptyState, ErrorState, SpaceCardSkeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listFavoriteSpaces, listSpacesByOwner, logSpaceUpdate } from '@/lib/api'
import type { Space } from '@/types/db'

function UpdateDialog({
  space, onClose, onLogged,
}: {
  space: Space | null
  onClose: () => void
  onLogged: () => void
}) {
  const toast = useToast()
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)

  const save = async () => {
    if (!space) return
    setPending(true)
    try {
      await logSpaceUpdate(space.id, note.trim())
      toast('Update posted.', 'success')
      setNote('')
      onLogged()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={Boolean(space)}
      onClose={onClose}
      title={space ? `Post an update to ${space.name}` : ''}
      description="Updates show on the public activity feed and count towards the platform total."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={pending} onClick={save}>Post update</Button>
        </>
      }
    >
      <Input
        label="What changed?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
        placeholder="Added a guestbook"
      />
    </Dialog>
  )
}

export default function Library() {
  const { profile } = useAuth()
  const [updating, setUpdating] = useState<Space | null>(null)

  const mine = useAsync(
    async () => (profile ? listSpacesByOwner(profile.id, true) : []),
    [profile?.id],
  )
  const saved = useAsync(
    async () => (profile ? listFavoriteSpaces(profile.id) : []),
    [profile?.id],
  )

  const drafts = (mine.data ?? []).filter((s) => !s.is_published)
  const published = (mine.data ?? []).filter((s) => s.is_published)

  return (
    <Page className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Library</h1>
        <p className="mt-1.5 text-muted">Everything you made and everything you saved.</p>
      </header>

      <section>
        <SectionHeading
          title="Published"
          subtitle="Live on Kobbleston."
          action={<Button size="sm" variant="subtle" to="/spaces/new" icon={faPlus}>New Space</Button>}
        />
        {mine.loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[0, 1, 2].map((i) => <SpaceCardSkeleton key={i} />)}
          </div>
        )}
        {mine.error && <ErrorState message={mine.error} onRetry={mine.reload} />}
        {!mine.loading && !published.length && (
          <Card>
            <EmptyState
              mood="emptyBox"
              title="Nothing published"
              body="Make a Space and publish it so people can come and visit."
              action={<Button to="/spaces/new" icon={faPlus}>Make a Space</Button>}
            />
          </Card>
        )}
        {!!published.length && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {published.map((space) => (
              <div key={space.id} className="group/tile relative">
                <SpaceCard space={space} />
                <button
                  onClick={() => setUpdating(space)}
                  aria-label={`Post an update about ${space.name}`}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-ink/80 text-white/80 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover/tile:opacity-100 focus-visible:opacity-100"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {!!drafts.length && (
        <section>
          <SectionHeading title="Drafts" subtitle="Only you can see these." />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {drafts.map((space) => <SpaceCard key={space.id} space={space} />)}
          </div>
        </section>
      )}

      <section>
        <SectionHeading title="Saved" subtitle="Spaces you starred." />
        {saved.loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[0, 1].map((i) => <SpaceCardSkeleton key={i} />)}
          </div>
        )}
        {saved.error && <ErrorState message={saved.error} onRetry={saved.reload} />}
        {!saved.loading && !saved.data?.length && (
          <Card>
            <EmptyState
              mood="emptyBox"
              title="Nothing saved yet"
              body="Star a Space and it lands here so you can find it again."
              action={<Button variant="subtle" to="/discover" icon={faStar}>Go find some</Button>}
            />
          </Card>
        )}
        {!!saved.data?.length && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {saved.data.map((space) => <SpaceCard key={space.id} space={space} />)}
          </div>
        )}
      </section>

      <UpdateDialog space={updating} onClose={() => setUpdating(null)} onLogged={mine.reload} />
    </Page>
  )
}
