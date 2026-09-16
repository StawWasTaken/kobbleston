import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Wordmark } from '@/components/brand/Wordmark'
import { Kobby } from '@/components/brand/Kobby'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuth } from '@/hooks/useAuth'
import { asset } from '@/lib/asset'

function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
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
    <form onSubmit={submit} className="space-y-3.5">
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
  const { session } = useAuth()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const isSignup = mode === 'signup'

  if (session) return <Navigate to="/home" replace />

  return (
    <div className="min-h-dvh bg-ink">
      <div
        className="h-40 border-b-4 border-brand-ink bg-brand-deep sm:h-52"
        style={{
          backgroundImage: `url(${asset('/brand/banner3.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="mx-auto -mt-24 w-full max-w-md px-4 pb-16 sm:-mt-28">
        <div className="mb-5 text-center">
          <Link to="/" className="inline-block"><Wordmark to={null} className="h-6" /></Link>
        </div>

        <div className="rounded-xl border border-ink-line bg-ink-card p-5 sm:p-6">
          {sentTo ? (
            <div className="text-center">
              <Kobby mood="notification" size="sm" className="mx-auto" />
              <h1 className="mt-4 text-lg font-extrabold">Check your email</h1>
              <p className="mt-2 text-sm text-muted">
                We sent a confirmation link to {sentTo}. Click it and your account is ready.
              </p>
              <Button variant="subtle" to="/login" block className="mt-5">Back to log in</Button>
            </div>
          ) : (
            <>
              <h1 className="mb-4 font-display text-2xl font-extrabold">
                {isSignup ? 'Sign up and start making things' : 'Log in'}
              </h1>
              {isSignup ? <SignupForm onSent={setSentTo} /> : <LoginForm />}

              <p className="mt-4 text-center text-sm text-muted">
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
      </div>
    </div>
  )
}
