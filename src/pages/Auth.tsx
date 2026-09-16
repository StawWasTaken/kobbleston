import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { faAt, faLock, faUser } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Wordmark } from '@/components/brand/Wordmark'
import { PixelField } from '@/components/brand/PixelField'
import { Kobby } from '@/components/brand/Kobby'
import { useAuth } from '@/hooks/useAuth'

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const { session, signIn, signUp } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [sentConfirmation, setSentConfirmation] = useState(false)

  if (session) return <Navigate to="/home" replace state={{ from: location }} />

  const isSignup = mode === 'signup'

  const usernameProblem = () => {
    if (!isSignup) return null
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return 'Letters, numbers and underscores. 3 to 20 characters.'
    }
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const problem = usernameProblem()
    if (problem) {
      setError(problem)
      return
    }
    setPending(true)
    setError(null)
    try {
      if (isSignup) {
        await signUp(email, password, username)
        setSentConfirmation(true)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <PixelField className="opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/85 to-ink" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block"><Wordmark to={null} className="h-6" /></Link>
          <p className="mt-2 text-sm text-muted">
            {isSignup ? 'Make an account and start building.' : 'Welcome back.'}
          </p>
        </div>

        {sentConfirmation ? (
          <div className="rounded-2xl border border-ink-line bg-ink-card p-6 text-center shadow-card">
            <Kobby mood="notification" size="sm" className="mx-auto" />
            <h1 className="mt-4 text-lg font-extrabold">Check your email</h1>
            <p className="mt-2 text-sm text-muted">
              We sent a confirmation link to {email}. Click it and you&apos;re in.
            </p>
            <Button variant="subtle" to="/login" block className="mt-5">Back to log in</Button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-ink-line bg-ink-card p-6 shadow-card"
          >
            <h1 className="text-xl font-extrabold">{isSignup ? 'Join Kobbleston' : 'Log in'}</h1>

            {isSignup && (
              <Input
                label="Username"
                icon={faUser}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                hint="This is your @name and the address of your Spaces."
              />
            )}

            <Input
              label="Email"
              type="email"
              icon={faAt}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              icon={faLock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={8}
              required
              hint={isSignup ? 'At least 8 characters.' : undefined}
              error={error}
            />

            <Button type="submit" block size="lg" loading={pending}>
              {isSignup ? 'Create account' : 'Log in'}
            </Button>

            {isSignup && (
              <p className="text-center text-xs leading-relaxed text-muted">
                Kobbleston is for people aged 15 and over.
              </p>
            )}

            <p className="text-center text-sm text-muted">
              {isSignup ? 'Already have an account? ' : 'New here? '}
              <Link to={isSignup ? '/login' : '/signup'} className="font-semibold text-[#9fadff] hover:underline">
                {isSignup ? 'Log in' : 'Make one'}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
