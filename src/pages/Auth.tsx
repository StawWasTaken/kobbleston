import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faShapes, faUsers, faAward } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Wordmark } from '@/components/brand/Wordmark'
import { Kobby } from '@/components/brand/Kobby'
import { PixelField } from '@/components/brand/PixelField'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuth } from '@/hooks/useAuth'

const selling: { icon: IconDefinition; title: string; body: string }[] = [
  { icon: faShapes, title: 'Build a Space', body: 'A page, a hangout, a thing that makes noise when you click it.' },
  { icon: faUsers, title: 'Bring people in', body: 'Friends, chat, and a list of who is inside right now.' },
  { icon: faAward, title: 'Earn badges', body: 'Every Space hands out its own. Go and collect them.' },
]

function LoginForm() {
  const { signIn } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
        error={error}
      />
      <Button type="submit" size="lg" block loading={pending}>Log In</Button>
    </form>
  )
}

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const { session, signInAsGuest } = useAuth()
  const navigate = useNavigate()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [guestPending, setGuestPending] = useState(false)
  const [guestError, setGuestError] = useState<string | null>(null)
  const isSignup = mode === 'signup'

  if (session) return <Navigate to="/home" replace />

  const enterAsGuest = async () => {
    setGuestPending(true)
    setGuestError(null)
    try {
      await signInAsGuest()
      navigate('/home')
    } catch {
      setGuestError('Guest mode is not switched on for this site yet.')
    } finally {
      setGuestPending(false)
    }
  }

  return (
    <div className="min-h-dvh bg-ink lg:grid lg:grid-cols-[1fr_30rem]">
      {/* ------------------------------------------------------- the pitch */}
      <aside className="relative hidden overflow-hidden border-r-2 border-brand-ink bg-brand-deep lg:flex lg:flex-col">
        <PixelField className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-deep/40 via-brand-deep/70 to-brand-ink" />

        <div className="relative flex flex-1 flex-col justify-center px-12 py-16">
          <Wordmark to="/" className="h-7 w-fit" />

          <h1 className="mt-8 max-w-md font-display text-5xl font-extrabold leading-[0.95]">
            {isSignup ? 'Make your own corner of the internet.' : 'Welcome back.'}
          </h1>

          <ul className="mt-10 max-w-sm space-y-5">
            {selling.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-b-[3px] border-brand-ink bg-brand text-white">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <span>
                  <span className="block font-display text-lg font-extrabold">{item.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-white/60">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Kobby size="lg" className="pointer-events-none absolute -bottom-4 right-8 opacity-90" />
      </aside>

      {/* -------------------------------------------------------- the form */}
      <main className="flex min-h-dvh flex-col px-4 py-8 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 transition-colors hover:text-white"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </Link>
          <Wordmark to="/" className="h-5 lg:hidden" />
        </div>

        <div className="mx-auto w-full max-w-sm flex-1">
          {sentTo ? (
            <div className="text-center">
              <Kobby mood="notification" size="md" className="mx-auto" />
              <h2 className="mt-5 font-display text-2xl font-extrabold">Check your email</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                We sent a confirmation link to {sentTo}. Click it and your account is ready.
              </p>
              <Button variant="subtle" to="/login" block className="mt-6">Back to log in</Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-3xl font-extrabold">
                {isSignup ? 'Sign Up' : 'Log In'}
              </h2>
              <p className="mb-6 mt-1.5 text-sm text-muted">
                {isSignup
                  ? 'Free, and it takes about a minute.'
                  : 'Pick up where you left off.'}
              </p>

              {isSignup ? <SignupForm onSent={setSentTo} /> : <LoginForm />}

              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-white/25">
                <span className="h-px flex-1 bg-ink-line" />
                or
                <span className="h-px flex-1 bg-ink-line" />
              </div>

              <Button
                variant="subtle"
                block
                loading={guestPending}
                onClick={enterAsGuest}
              >
                Play as Guest
              </Button>
              {guestError && <p className="mt-2 text-center text-xs text-red-400">{guestError}</p>}

              <p className="mt-6 text-center text-sm text-muted">
                {isSignup ? 'Already have an account? ' : 'New here? '}
                <Link
                  to={isSignup ? '/login' : '/signup'}
                  className="font-bold text-[#9fadff] hover:underline"
                >
                  {isSignup ? 'Log in' : 'Sign up'}
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
