import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faShapes } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Button } from '@/components/ui/Button'
import { SpaceCardSkeleton } from '@/components/ui/States'
import { Wordmark } from '@/components/brand/Wordmark'
import { Signature } from '@/components/brand/Signature'
import { Kobby } from '@/components/brand/Kobby'
import { SpaceCard } from '@/components/spaces/SpaceCard'
import { AssetTile } from '@/components/create/AssetTile'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { listAssets, listSpaces } from '@/lib/api'
import { asset } from '@/lib/asset'

function TopBar() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
    } catch {
      setFailed(true)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b-2 border-brand-ink bg-brand-deep">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Wordmark to={null} className="h-5" />

        <nav className="hidden items-center gap-5 text-sm font-bold text-white/75 sm:flex">
          <Link to="/discover" className="hover:text-white">Discover</Link>
          <Link to="/create" className="hover:text-white">Create</Link>
        </nav>

        <form onSubmit={submit} className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="quick-email">Email</label>
          <input
            id="quick-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="hidden h-8 w-36 rounded-md border border-white/20 bg-black/30 px-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/50 md:block"
          />
          <label className="sr-only" htmlFor="quick-password">Password</label>
          <input
            id="quick-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="hidden h-8 w-32 rounded-md border border-white/20 bg-black/30 px-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/50 md:block"
          />
          <Button type="submit" size="sm" variant="subtle" className="hidden md:inline-flex">Log In</Button>
          <Button size="sm" to="/login" className="md:hidden">Log In</Button>
          {failed && (
            <p role="alert" className="hidden text-xs text-red-300 lg:block">Wrong email or password</p>
          )}
        </form>
      </div>
    </header>
  )
}

function Feature({
  icon, title, children,
}: {
  icon: IconDefinition
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <span className="grid h-12 w-12 place-items-center rounded-xl border-b-[3px] border-brand-ink bg-brand text-lg text-white">
        <FontAwesomeIcon icon={icon} />
      </span>
      <h2 className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-sm leading-relaxed text-white/60">{children}</p>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const spaces = useAsync(() => listSpaces({ sort: 'trending', limit: 6 }), [])
  const assets = useAsync(() => listAssets({ limit: 8 }), [])

  return (
    <div className="min-h-dvh bg-ink">
      <TopBar />

      {/* ----------------------------------------------------------- hero */}
      <section className="relative border-b-4 border-brand-ink">
        <img
          src={asset('/brand/banner3.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_22rem]">
          <div className="self-center">
            <Wordmark to={null} className="h-8 sm:h-11" />
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.9] sm:text-7xl">
              Make Something
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/70">
              Build your own Space, fill it with whatever you want, and let people in.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" to="/discover">Look Around</Button>
              <Button size="lg" variant="subtle" to="/create">Start Building</Button>
            </div>
          </div>

          <div className="rounded-xl border border-ink-line bg-ink-card p-5">
            <h2 className="mb-4 font-display text-xl font-extrabold">Sign Up</h2>
            <SignupForm onSent={() => navigate('/signup')} />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- community */}
      <section className="border-b border-ink-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[18rem_1fr] lg:gap-12">
          <Feature icon={faUsers} title="Places To Go">
            Every Space is somebody&apos;s corner of the internet. Walk into one and see
            what they did with it.
          </Feature>

          <div>
            {spaces.loading && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => <SpaceCardSkeleton key={i} />)}
              </div>
            )}

            {!spaces.loading && !spaces.data?.length && (
              <div className="flex items-center gap-4 rounded-xl border border-ink-line bg-ink-card p-5">
                <Kobby mood="construction" size="sm" bob={false} />
                <p className="text-sm text-white/60">
                  Nobody has published a Space yet. Yours would be the first one here.
                </p>
              </div>
            )}

            {!!spaces.data?.length && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {spaces.data.map((space) => <SpaceCard key={space.id} space={space} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- create */}
      <section className="border-b border-ink-line bg-ink-raised/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_18rem] lg:gap-12">
          <div className="order-2 lg:order-1">
            {assets.loading && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/[0.06]" />
                ))}
              </div>
            )}

            {!assets.loading && !assets.data?.length && (
              <div className="flex items-center gap-4 rounded-xl border border-ink-line bg-ink-card p-5">
                <Kobby mood="emptyBox" size="sm" bob={false} />
                <p className="text-sm text-white/60">
                  The marketplace is empty. Upload the first image, sound or font.
                </p>
              </div>
            )}

            {!!assets.data?.length && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {assets.data.map((item) => <AssetTile key={item.id} item={item} />)}
              </div>
            )}
          </div>

          <div className="order-1 lg:order-2">
            <Feature icon={faShapes} title="Kobbleston Create">
              Upload images, sounds, video and fonts. Everything gets reviewed, then it is
              yours and everyone else&apos;s to build with.
            </Feature>
            <Button to="/create" className="mt-5">Open Create</Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ signed note */}
      <section className="border-b border-ink-line">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <Kobby mood="crown" size="md" className="mx-auto" bob={false} />
          <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">
            Empowering Creativity
          </h2>
          <p className="mt-4 leading-relaxed text-white/70">
            We are dedicated to building a platform where creators and innovators can bring
            ideas to life with total freedom, supported by intuitive tools and vibrant
            community spaces.
          </p>
          <p className="mt-3 leading-relaxed text-white/70">
            Our goal is to foster an inspiring environment where imagination and connection
            can thrive without limits.
          </p>

          <p className="mt-10 text-sm text-white/50">Signed,</p>
          <Signature className="mx-auto mt-1 w-fit" />
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/40">
            CEO of Kobbleston
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- cta */}
      <section className="relative border-b-4 border-brand-ink">
        <img
          src={asset('/brand/topbar.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-ink/45" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-display text-4xl font-extrabold sm:text-5xl">Make Something</h2>
          <p className="mx-auto mt-3 max-w-sm text-white/70">
            Free, takes five minutes, and nobody is going to build it for you.
          </p>
          <Button size="lg" to="/signup" className="mt-6">Sign Up</Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-x-6 gap-y-2 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
        <Wordmark to={null} className="h-4 opacity-60" />
        <Link to="/discover" className="hover:text-white">Discover</Link>
        <Link to="/create" className="hover:text-white">Create</Link>
        <Link to="/terms" className="hover:text-white">Terms</Link>
        <Link to="/guidelines" className="hover:text-white">Guidelines</Link>
      </footer>
    </div>
  )
}
