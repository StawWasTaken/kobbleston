import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { faRightFromBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { PresenceLabel, presenceOf } from '@/components/ui/StatusDot'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { getCommunity, isCommunityMember, listCommunityMembers, setCommunityMembership } from '@/lib/api'
import { formatCount } from '@/lib/format'
import type { CommunityRole } from '@/types/db'

export default function CommunityPage() {
  const { slug = '' } = useParams()
  const { profile } = useAuth()
  const toast = useToast()
  const [role, setRole] = useState<CommunityRole | null>(null)
  const [pending, setPending] = useState(false)

  const community = useAsync(() => getCommunity(slug), [slug])
  const members = useAsync(
    async () => (community.data ? listCommunityMembers(community.data.id) : []),
    [community.data?.id],
  )

  useEffect(() => {
    if (!profile || !community.data) return
    isCommunityMember(community.data.id, profile.id).then(setRole)
  }, [profile, community.data])

  const toggle = async () => {
    if (!profile || !community.data) return
    const joining = role === null
    setPending(true)
    try {
      await setCommunityMembership(community.data.id, profile.id, joining)
      setRole(joining ? 'member' : null)
      community.reload()
      members.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    } finally {
      setPending(false)
    }
  }

  if (community.loading) {
    return <Page className="space-y-4"><Skeleton className="h-32 w-full" /></Page>
  }

  if (community.error) {
    return <Page><ErrorState message={community.error} onRetry={community.reload} /></Page>
  }

  if (!community.data) {
    return (
      <Page>
        <Card>
          <EmptyState
            mood="noResults"
            title="No community here"
            body={`There is no community at "${slug}".`}
            action={<Button to="/communities">All communities</Button>}
          />
        </Card>
      </Page>
    )
  }

  const group = community.data

  return (
    <Page className="max-w-4xl">
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-deep font-display text-2xl font-extrabold">
          {group.icon_url
            ? <img src={group.icon_url} alt="" className="h-full w-full object-cover" />
            : group.name.slice(0, 2).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{group.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {formatCount(group.member_count)} {group.member_count === 1 ? 'member' : 'members'}
          </p>
          {role && <Badge tone="brand" className="mt-2">{role}</Badge>}
        </div>

        {profile && role !== 'owner' && (
          <Button
            variant={role ? 'subtle' : 'primary'}
            icon={role ? faRightFromBracket : faUserPlus}
            loading={pending}
            onClick={toggle}
          >
            {role ? 'Leave' : 'Join'}
          </Button>
        )}
      </Card>

      {group.description && (
        <p className="mt-6 max-w-2xl whitespace-pre-wrap leading-relaxed text-white/70">
          {group.description}
        </p>
      )}

      <h2 className="mb-3 mt-8 font-display text-xl font-extrabold">Members</h2>

      {members.loading && (
        <Card className="space-y-2 p-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
        </Card>
      )}

      {!!members.data?.length && (
        <Card className="overflow-hidden">
          <ul>
            {members.data.map(({ role: memberRole, profile: person }) => (
              <li
                key={person.id}
                className="flex items-center gap-3 border-b border-ink-line/70 px-4 py-3 last:border-0"
              >
                <Link to={`/u/${person.username}`} className="shrink-0">
                  <Avatar src={person.avatar_url} name={person.display_name} size="md" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/u/${person.username}`} className="block truncate font-bold hover:underline">
                    {person.display_name}
                  </Link>
                  <PresenceLabel presence={presenceOf(person)} />
                </div>
                {memberRole !== 'member' && <Badge tone="brand">{memberRole}</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  )
}
