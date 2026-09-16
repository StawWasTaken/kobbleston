import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import { SpaceRail } from '@/components/spaces/SpaceRail'
import { FriendsRail } from '@/components/social/FriendsRail'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listSpaces, listSpacesByOwner } from '@/lib/api'

export default function Home() {
  const { profile } = useAuth()

  const mine = useAsync(
    async () => (profile ? listSpacesByOwner(profile.id, true) : []),
    [profile?.id],
  )
  const trending = useAsync(() => listSpaces({ sort: 'trending', limit: 15 }), [])
  const fresh = useAsync(() => listSpaces({ sort: 'new', limit: 15 }), [])
  const liked = useAsync(() => listSpaces({ sort: 'popular', limit: 15 }), [])

  return (
    <Page>
      <h1 className="mb-6 font-display text-3xl font-extrabold sm:text-4xl">
        {profile ? `Welcome back, ${profile.display_name}` : 'Home'}
      </h1>

      {profile && <FriendsRail />}

      <SpaceRail
        title="Your Spaces"
        spaces={mine.data}
        loading={mine.loading}
        empty={
          <Card>
            <EmptyState
              mood="emptyBox"
              title="You haven&rsquo;t made anything yet"
              body="A Space can be a page about your cat. That is a completely valid use of this website."
              action={<Button to="/spaces/new" icon={faPlus}>Make your first Space</Button>}
            />
          </Card>
        }
      />

      <SpaceRail
        title="Being visited right now"
        spaces={trending.data}
        loading={trending.loading}
        empty={
          <Card>
            <EmptyState
              mood="construction"
              title="Nothing published yet"
              body="When people start publishing Spaces, the busy ones land here."
            />
          </Card>
        }
      />

      <SpaceRail title="Just published" spaces={fresh.data} loading={fresh.loading} />
      <SpaceRail title="Most liked" spaces={liked.data} loading={liked.loading} />
    </Page>
  )
}
