import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleInfo, faGear, faUserGroup, faUserShield, faHandshake, faScroll,
  faArrowRight, faMagnifyingGlass, faPlus, faSkull, faCalendarDay,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { ImageDrop } from '@/components/community/ImageDrop'
import { CommunityMembers } from '@/components/community/CommunityMembers'
import { RolesEditor } from '@/components/community/RolesEditor'
import { AffiliateGrid } from '@/components/community/AffiliateGrid'
import { EventsEditor } from '@/components/community/EventsEditor'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  answerAllyRequest, declareEnemy, getCommunity, getCommunityOverview, liftBan,
  listCommunities, listCommunityAudit, listCommunityBanned, listRelations, removeRelation,
  requestAlly, updateCommunity, uploadCommunityImage,
} from '@/lib/api'
import { formatCount, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import { avatarOf } from '@/lib/avatars'
import { profileLink } from '@/lib/links'
import { Kube } from '@/components/brand/Kube'

type Section = 'Information' | 'Settings' | 'Events' | 'Members' | 'Roles' | 'Affiliates' | 'Audit Log'

const sections: { name: Section; icon: IconDefinition }[] = [
  { name: 'Information', icon: faCircleInfo },
  { name: 'Settings', icon: faGear },
  { name: 'Events', icon: faCalendarDay },
  { name: 'Members', icon: faUserGroup },
  { name: 'Roles', icon: faUserShield },
  { name: 'Affiliates', icon: faHandshake },
  { name: 'Audit Log', icon: faScroll },
]

export default function ConfigureCommunity() {
  const { slug = '' } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // A link can name the section it wants, so "Make an event" lands on Events
  // rather than on the front of Configure.
  const asked = params.get('section') as Section | null
  const [section, setSectionState] = useState<Section>(
    asked && sections.some((s) => s.name === asked) ? asked : 'Information',
  )
  const setSection = (next: Section) => {
    setSectionState(next)
    setParams(next === 'Information' ? {} : { section: next }, { replace: true })
  }

  const community = useAsync(() => getCommunity(slug), [slug])
  const group = community.data
  const rights = useAsync(
    async () => (group ? getCommunityOverview(group.id) : null),
    [group?.id, profile?.id],
  )

  if (community.loading) return <Page><Skeleton className="h-64 w-full" /></Page>
  if (community.error) {
    return <Page><ErrorState message={community.error} onRetry={community.reload} /></Page>
  }
  if (!group) {
    return <Page><Card className="p-6"><p className="text-sm text-muted">No such Community.</p></Card></Page>
  }
  if (rights.data && !rights.data.can_manage_community) {
    return (
      <Page>
        <Card className="p-6">
          <p className="text-sm text-muted">You cannot configure this Community.</p>
          <Button variant="subtle" to={`/c/${slug}`} className="mt-4">Back to Community</Button>
        </Card>
      </Page>
    )
  }

  return (
    <Page className="max-w-[80rem]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
            Configure {group.name}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <Kube className="text-link" />
            Community Funds: {formatCount(group.funds ?? 0)}
          </p>
        </div>
        <Link
          to={`/c/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-link hover:underline"
        >
          Back to Community <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:items-start">
        <Card className="overflow-hidden p-1.5 lg:sticky lg:top-20">
          <nav aria-label="Configure sections">
            {sections.map((item) => (
              <button
                key={item.name}
                onClick={() => setSection(item.name)}
                aria-current={section === item.name}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                  section === item.name
                    ? 'bg-brand text-white'
                    : 'text-white/65 hover:bg-ink-hover hover:text-white',
                )}
              >
                <FontAwesomeIcon icon={item.icon} className="w-4 text-xs opacity-70" />
                <span className="flex-1">{item.name}</span>
                {item.name === 'Members' && !!rights.data?.request_count && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-[11px] font-extrabold text-brand-deep">
                    {rights.data.request_count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </Card>

        <div className="min-w-0">
          {section === 'Information' && (
            <Information group={group} onSaved={community.reload} />
          )}

          {section === 'Settings' && (
            <SettingsSection group={group} onSaved={community.reload} />
          )}

          {section === 'Members' && (
            <MembersSection
              communityId={group.id}
              ownerId={group.owner_id}
              rights={rights.data}
              onChanged={() => { community.reload(); rights.reload() }}
            />
          )}

          {section === 'Roles' && <RolesEditor communityId={group.id} />}

          {section === 'Events' && <EventsEditor communityId={group.id} />}

          {section === 'Affiliates' && <AffiliatesSection communityId={group.id} />}

          {section === 'Audit Log' && <AuditSection communityId={group.id} />}
        </div>
      </div>

      {group.owner_id === profile?.id && section === 'Settings' && (
        <p className="mt-6 text-xs text-muted">
          Community {group.slug} · created {timeAgo(group.created_at)} ·{' '}
          <button onClick={() => navigate(`/c/${slug}`)} className="underline hover:text-white">
            view it
          </button>
        </p>
      )}
    </Page>
  )
}

/* ------------------------------------------------------------ information */

function Information({ group, onSaved }: { group: NonNullable<Awaited<ReturnType<typeof getCommunity>>>; onSaved: () => void }) {
  const { profile } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? '')
  const [emblem, setEmblem] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [pending, setPending] = useState(false)

  const save = async () => {
    if (!profile) return
    setPending(true)
    try {
      const [iconUrl, bannerUrl] = await Promise.all([
        emblem ? uploadCommunityImage(profile.id, emblem, 'emblem') : Promise.resolve(group.icon_url),
        cover ? uploadCommunityImage(profile.id, cover, 'cover') : Promise.resolve(group.banner_url),
      ])
      await updateCommunity(group.id, {
        name: name.trim(),
        description: description.trim() || null,
        icon_url: iconUrl,
        banner_url: bannerUrl,
      })
      toast('Saved.', 'success')
      setEmblem(null)
      setCover(null)
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="space-y-6 p-5 sm:p-6">
      <ImageDrop label="Emblem" required file={emblem} existing={group.icon_url} onChange={setEmblem} />

      <ImageDrop
        label="Cover photo"
        aspect="wide"
        file={cover}
        existing={group.banner_url}
        onChange={setCover}
        note="Wide, around 1440 by 456. It fades into the page behind the name."
      />

      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50}
        hint={`${name.length}/50`} />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
        className="min-h-[10rem]"
        hint={`${description.length}/1000`}
      />

      <div className="flex justify-end">
        <Button loading={pending} onClick={save}>Save</Button>
      </div>
    </Card>
  )
}

/* --------------------------------------------------------------- settings */

function SettingsSection({ group, onSaved }: { group: NonNullable<Awaited<ReturnType<typeof getCommunity>>>; onSaved: () => void }) {
  const toast = useToast()
  const [policy, setPolicy] = useState(group.join_policy)
  const [pending, setPending] = useState(false)

  const save = async () => {
    setPending(true)
    try {
      await updateCommunity(group.id, { join_policy: policy })
      toast('Saved.', 'success')
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Joining</legend>
        <div className="space-y-2">
          {([
            { value: 'open', label: 'Anyone can join', note: 'People join straight away.' },
            { value: 'approval', label: 'Manual approval', note: 'You let people in one at a time.' },
          ] as const).map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                policy === option.value
                  ? 'border-brand-bright bg-brand/15'
                  : 'border-ink-line bg-ink-raised hover:bg-ink-hover',
              )}
            >
              <input
                type="radio"
                name="join-policy"
                checked={policy === option.value}
                onChange={() => setPolicy(option.value)}
                className="mt-0.5 accent-[#1B34E8]"
              />
              <span>
                <span className="block text-sm font-bold">{option.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{option.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button loading={pending} onClick={save}>Save</Button>
      </div>
    </Card>
  )
}

/* ---------------------------------------------------------------- members */

function MembersSection({
  communityId, ownerId, rights, onChanged,
}: {
  communityId: string
  ownerId: string
  rights: Awaited<ReturnType<typeof getCommunityOverview>> | null
  onChanged: () => void
}) {
  const toast = useToast()
  const [tab, setTab] = useState<'Members' | 'Banned'>('Members')
  const banned = useAsync(
    async () => (tab === 'Banned' ? listCommunityBanned(communityId) : []),
    [communityId, tab],
  )

  return (
    <div className="space-y-5">
      <div className="flex border-b border-ink-line" role="tablist">
        {(['Members', 'Banned'] as const).map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              'border-b-2 px-6 py-2.5 text-sm font-bold transition-colors',
              tab === name ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === 'Members' && (
        <CommunityMembers
          communityId={communityId}
          ownerId={ownerId}
          rights={rights}
          onChanged={onChanged}
        />
      )}

      {tab === 'Banned' && (
        <Card className="overflow-hidden">
          {banned.loading && (
            <div className="space-y-2 p-4">
              {[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          )}
          {!banned.loading && !banned.data?.length && (
            <p className="px-4 py-8 text-center text-sm text-muted">Nobody is banned.</p>
          )}
          <ul>
            {banned.data?.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-3 border-b border-ink-line/70 px-4 py-3 last:border-0"
              >
                <Avatar src={avatarOf(person)} name={person.display_name} size="md" />
                <div className="min-w-0 flex-1">
                  <Link to={profileLink(person)} className="block truncate font-bold hover:underline">
                    {person.display_name}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {person.reason ?? 'No reason given'} · {timeAgo(person.banned_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={async () => {
                    try {
                      await liftBan(communityId, person.id)
                      banned.reload()
                    } catch (err) {
                      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
                    }
                  }}
                >
                  Lift ban
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- affiliates */

function AffiliatesSection({ communityId }: { communityId: string }) {
  const toast = useToast()
  const [tab, setTab] = useState<'Allies' | 'Enemies' | 'Requests'>('Allies')
  const [finding, setFinding] = useState(false)
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250)
    return () => window.clearTimeout(timer)
  }, [term])

  const allies = useAsync(() => listRelations(communityId, 'ally'), [communityId, tab])
  const enemies = useAsync(() => listRelations(communityId, 'enemy'), [communityId, tab])
  const requests = useAsync(() => listRelations(communityId, 'ally', true), [communityId, tab])
  const candidates = useAsync(
    async () => (finding && debounced ? listCommunities(debounced) : []),
    [finding, debounced],
  )

  const guard = async (run: () => Promise<void>) => {
    try {
      await run()
      allies.reload()
      enemies.reload()
      requests.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 border-b border-ink-line" role="tablist">
        {(['Allies', 'Enemies', 'Requests'] as const).map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              'border-b-2 px-5 py-2.5 text-sm font-bold transition-colors',
              tab === name ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white',
            )}
          >
            {name}
            {name === 'Requests' && !!requests.data?.filter((r) => r.incoming).length && (
              <span className="ml-1.5 text-link">
                ({requests.data.filter((r) => r.incoming).length})
              </span>
            )}
          </button>
        ))}
        <Button size="sm" className="ml-auto mb-1.5" icon={faPlus} onClick={() => setFinding((v) => !v)}>
          {tab === 'Enemies' ? 'Declare Enemy' : 'Send Ally Request'}
        </Button>
      </div>

      {finding && (
        <Card className="space-y-3 p-4">
          <Input
            icon={faMagnifyingGlass}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={tab === 'Enemies'
              ? 'Find a Community to declare an enemy'
              : 'Find a Community to ally with'}
            aria-label="Find a Community"
          />
          <p className="text-xs text-muted">
            An alliance needs both sides to agree. Declaring an enemy does not, and it
            ends any alliance between you straight away.
          </p>
          {!!candidates.data?.length && (
            <ul className="space-y-1">
              {candidates.data
                .filter((c) => c.id !== communityId)
                .map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-hover">
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-deep text-xs font-extrabold">
                      {c.icon_url
                        ? <img src={c.icon_url} alt="" className="h-full w-full object-cover" />
                        : c.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{c.name}</span>
                    <Button
                      size="sm"
                      variant={tab === 'Enemies' ? 'ghost' : 'subtle'}
                      icon={faHandshake}
                      onClick={() => guard(async () => {
                        await requestAlly(communityId, c.id)
                        toast('Ally request sent.', 'success')
                      })}
                    >
                      Ally
                    </Button>
                    <Button
                      size="sm"
                      variant={tab === 'Enemies' ? 'subtle' : 'ghost'}
                      icon={faSkull}
                      onClick={() => guard(async () => {
                        await declareEnemy(communityId, c.id)
                        toast(`${c.name} is now an enemy.`, 'info')
                        setTab('Enemies')
                        setFinding(false)
                        setTerm('')
                      })}
                    >
                      Enemy
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'Allies' && (
        <AffiliateGrid
          relations={allies.data}
          loading={allies.loading}
          empty="No allies yet."
          onRemove={(id) => guard(() => removeRelation(communityId, id))}
        />
      )}

      {tab === 'Enemies' && (
        <AffiliateGrid
          relations={enemies.data}
          loading={enemies.loading}
          empty="Nobody has been declared an enemy."
          onRemove={(id) => guard(() => removeRelation(communityId, id))}
        />
      )}

      {tab === 'Requests' && (
        <AffiliateGrid
          relations={requests.data}
          loading={requests.loading}
          empty="No requests waiting."
          onAnswer={(id, accept) => guard(() => answerAllyRequest(communityId, id, accept))}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------- audit log */

function AuditSection({ communityId }: { communityId: string }) {
  const log = useAsync(() => listCommunityAudit(communityId), [communityId])

  return (
    <Card className="overflow-hidden">
      {log.loading && (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
        </div>
      )}

      {!log.loading && !log.data?.length && (
        <p className="px-4 py-8 text-center text-sm text-muted">Nothing has happened yet.</p>
      )}

      <ul>
        {log.data?.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 border-b border-ink-line/70 px-4 py-2.5 last:border-0"
          >
            <Avatar
              src={entry.actor_avatar_url}
              name={entry.actor_display_name ?? 'K'}
              size="xs"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-white/75">
              <span className="font-bold text-white">
                {entry.actor_display_name ?? 'Someone'}
              </span>{' '}
              {entry.action.replace(/_/g, ' ')}
            </span>
            <span className="shrink-0 text-xs text-muted">{timeAgo(entry.created_at)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
