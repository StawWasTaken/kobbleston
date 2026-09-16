import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { faMagnifyingGlass, faPlus, faUsers } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input, Textarea } from '@/components/ui/Input'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { createCommunity, listCommunities, listMemberCommunities } from '@/lib/api'
import { formatCount, slugify } from '@/lib/format'

function CommunityCard({
  slug, name, icon, members, note,
}: {
  slug: string
  name: string
  icon: string | null
  members: number
  note?: string
}) {
  return (
    <Link
      to={`/c/${slug}`}
      className="flex items-center gap-3 rounded-xl border border-ink-line bg-ink-card p-3 transition-colors hover:border-brand/60"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-deep font-display text-base font-extrabold">
        {icon ? <img src={icon} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{name}</span>
        <span className="block text-xs text-muted">
          {formatCount(members)} members{note && ` · ${note}`}
        </span>
      </span>
    </Link>
  )
}

export default function Communities() {
  const { profile } = useAuth()
  const toast = useToast()
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [making, setMaking] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250)
    return () => window.clearTimeout(timer)
  }, [term])

  const all = useAsync(() => listCommunities(debounced), [debounced])
  const mine = useAsync(
    async () => (profile ? listMemberCommunities(profile.id) : []),
    [profile?.id],
  )

  const create = async () => {
    if (!profile) return
    const slug = slugify(name)
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
      setError('The name needs at least three letters or numbers.')
      return
    }
    setPending(true)
    setError(null)
    try {
      await createCommunity({ ownerId: profile.id, name, slug, description })
      toast('Community created.', 'success')
      setName('')
      setDescription('')
      setMaking(false)
      all.reload()
      mine.reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'That did not save.'
      setError(message.includes('duplicate') ? 'That name is taken.' : message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Page className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="min-w-0">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Communities</h1>
            <p className="mt-1.5 text-muted">Groups of people building around the same thing.</p>
          </div>
          <Button icon={faPlus} onClick={() => setMaking(true)} disabled={!profile}>
            New Community
          </Button>
        </header>

        <Input
          icon={faMagnifyingGlass}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search communities"
          aria-label="Search communities"
          className="mb-5"
        />

        {all.loading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[4.5rem]" />)}
          </div>
        )}

        {all.error && <ErrorState message={all.error} onRetry={all.reload} />}

        {!all.loading && !all.error && !all.data?.length && (
          <Card>
            <EmptyState
              mood={debounced ? 'noResults' : 'emptyBox'}
              title={debounced ? 'Kobby could not find anything' : 'No communities yet'}
              body={
                debounced
                  ? `Nothing matches "${debounced}".`
                  : 'Start the first one and people can join it.'
              }
            />
          </Card>
        )}

        {!!all.data?.length && (
          <div className="grid gap-3 sm:grid-cols-2">
            {all.data.map((community) => (
              <CommunityCard
                key={community.id}
                slug={community.slug}
                name={community.name}
                icon={community.icon_url}
                members={community.member_count}
              />
            ))}
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-20">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-line px-4 py-3.5">
            <FontAwesomeIcon icon={faUsers} className="text-white/40" />
            <h2 className="text-sm font-extrabold">Yours</h2>
          </div>

          {mine.loading && (
            <div className="space-y-2 p-3">
              {[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          )}

          {!mine.loading && !mine.data?.length && (
            <p className="px-4 py-6 text-center text-sm text-muted">
              You have not joined any yet.
            </p>
          )}

          {!!mine.data?.length && (
            <div className="space-y-2 p-3">
              {mine.data.map((community) => (
                <CommunityCard
                  key={community.id}
                  slug={community.slug}
                  name={community.name}
                  icon={community.icon_url}
                  members={community.member_count}
                  note={community.role === 'member' ? undefined : community.role}
                />
              ))}
            </div>
          )}
        </Card>
      </aside>

      <Dialog
        open={making}
        onClose={() => setMaking(false)}
        title="New Community"
        description="You will be its owner. People can find and join it straight away."
        footer={
          <>
            <Button variant="ghost" onClick={() => setMaking(false)}>Cancel</Button>
            <Button loading={pending} onClick={create}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={48}
            error={error}
            hint={name ? `kobbleston.com/c/${slugify(name)}` : undefined}
          />
          <Textarea
            label="What is it about?"
            labelNote="optional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
          />
        </div>
      </Dialog>
    </Page>
  )
}
