import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faLock, faUser } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Wordmark } from '@/components/brand/Wordmark'
import { Kobby } from '@/components/brand/Kobby'
import { PixelField } from '@/components/brand/PixelField'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

function LoginForm() {
  const { signInWithName } = useAuth()
  const [params] = useSearchParams()
  const [username, setUsername] = useState(params.get('username') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await signInWithName(username.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wrong username or password.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label="Username"
        icon={faUser}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        required
      />
      <Input
        label="Password"
        icon={faLock}
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
    } catch (err) {
      setGuestError(
        err instanceof Error && err.message.includes('limit')
          ? err.message
          : 'Guest mode is not switched on for this site yet.',
      )
    } finally {
      setGuestPending(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink">
      <PixelField className="opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/85 to-ink" />

      <header className="relative flex items-center justify-between px-4 py-5 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 transition-colors hover:text-white"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back
        </Link>
      </header>

      <main className="relative flex flex-1 items-start justify-center px-4 pb-16 sm:items-center">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Wordmark to="/" className="mx-auto h-7" />
          </div>

          <div className="relative rounded-2xl border border-ink-line bg-ink-card p-6 shadow-pop sm:p-8">
            {/* Kobby leans on the corner of the card */}
            <Kobby
              mood={sentTo ? 'notification' : 'default'}
              size="sm"
              bob={false}
              className="pointer-events-none absolute -right-4 -top-10 hidden h-20 rotate-6 sm:block"
            />

            {sentTo ? (
              <div className="text-center">
                <h1 className="font-display text-2xl font-extrabold">Check your email</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  We sent a confirmation link to {sentTo}. Click it and your account is ready.
                </p>
                <Button variant="subtle" to="/login" block className="mt-6">Back to log in</Button>
              </div>
            ) : (
              <>
                <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-ink-line bg-ink-raised p-1">
                  {(['login', 'signup'] as const).map((which) => (
                    <Link
                      key={which}
                      to={which === 'login' ? '/login' : '/signup'}
                      replace
                      className={cn(
                        'rounded-lg py-2 text-center text-sm font-bold transition-colors',
                        mode === which
                          ? 'bg-brand text-white'
                          : 'text-white/55 hover:bg-ink-hover hover:text-white',
                      )}
                    >
                      {which === 'login' ? 'Log In' : 'Sign Up'}
                    </Link>
                  ))}
                </div>

                <h1 className="font-display text-2xl font-extrabold">
                  {isSignup ? 'Make an account' : 'Welcome back'}
                </h1>
                <p className="mb-5 mt-1 text-sm text-muted">
                  {isSignup
                    ? 'Free, and it takes about a minute.'
                    : 'Log in with your username.'}
                </p>

                {isSignup ? <SignupForm onSent={setSentTo} /> : <LoginForm />}

                <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-white/25">
                  <span className="h-px flex-1 bg-ink-line" />
                  or
                  <span className="h-px flex-1 bg-ink-line" />
                </div>

                <Button variant="subtle" block loading={guestPending} onClick={enterAsGuest}>
                  Play as Guest
                </Button>
                {guestError && (
                  <p className="mt-2 text-center text-xs text-danger">{guestError}</p>
                )}
                <p className="mt-2 text-center text-[11px] text-white/35">
                  Guests can look around. Making things needs an account.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
