import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStore } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '@/components/ui/Avatar'
import { Kobby } from '@/components/brand/Kobby'
import { Kube } from '@/components/brand/Kube'
import { Skeleton } from '@/components/ui/States'
import { StyleLayer } from '@/components/style/StyleLayer'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { asWorn, styleShop } from '@/lib/api'
import { avatarOf } from '@/lib/avatars'
import { formatCount } from '@/lib/format'

/**
 * Style on the front page: eight things from the shop, each one already on a
 * face, because a hat on its own tells nobody what it looks like worn.
 */
export function StyleStrip() {
  const { profile } = useAuth()
  const { data, loading } = useAsync(() => styleShop({ limit: 8 }), [])
  const face = avatarOf(profile)
  const items = data ?? []

  const canMake = Boolean(profile?.is_verified || profile?.is_admin)

  return (
    <section className="mb-8">
      <div className="grid gap-5 rounded-3xl border border-ink-line bg-ink-card p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {loading && [0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}

          {/* An empty shop is still worth saying out loud: the panel is how
              anybody finds out Style is there at all. */}
          {!loading && !items.length && (
            <div className="col-span-2 grid place-items-center rounded-2xl border border-dashed border-ink-line bg-ink-raised p-8 text-center sm:col-span-4">
              <p className="text-sm font-bold">Nothing in the shop yet</p>
              <p className="mt-1 max-w-sm text-xs text-muted">
                {canMake
                  ? 'You are verified, so you can put the first thing in it.'
                  : 'Verified accounts put things here. Check back shortly.'}
              </p>
            </div>
          )}

          {items.map((item) => (
            <Link
              key={item.id}
              to="/style"
              className="group overflow-hidden rounded-2xl border border-ink-line bg-ink-raised transition-colors hover:border-brand/60"
            >
              <span className="relative grid aspect-square place-items-center p-5">
                <span className="relative block h-full w-full max-w-[7rem]">
                  <StyleLayer items={[asWorn(item)]} layer={0} />
                  <span className="relative block h-full w-full">
                    <Avatar
                      src={face}
                      name={profile?.display_name ?? 'You'}
                      size="md"
                      className="h-full w-full rounded-full"
                    />
                  </span>
                  <StyleLayer items={[asWorn(item)]} layer={1} />
                </span>
              </span>

              <span className="block border-t border-ink-line p-2.5">
                <span className="block truncate text-sm font-bold">{item.name}</span>
                <span className="block truncate text-xs text-muted">
                  By @{item.creator_username}
                </span>
                <span className="mt-1 flex items-center gap-1 text-sm font-extrabold">
                  {item.price > 0 ? (
                    <>
                      <Kube className="h-3.5 w-3.5" />
                      {formatCount(item.price)}
                    </>
                  ) : 'Free'}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center lg:text-left">
          <Kobby mood="style" size="lg" className="mx-auto lg:mx-0" />
          <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
            Express your style
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Hats, hair and whatever else people make. Put one on and you wear it everywhere
            you turn up on Kobbleston.
          </p>
          <Link
            to="/style"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-ink-line bg-ink-raised px-4 py-2.5 text-sm font-bold transition-colors hover:bg-ink-hover"
          >
            <FontAwesomeIcon icon={faStore} />
            Browse the shop
          </Link>
        </div>
      </div>
    </section>
  )
}
