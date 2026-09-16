import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Reveal } from '@/components/ui/Reveal'
import { BirthdayPicker, birthdayToDate, emptyBirthday } from './BirthdayPicker'
import type { Birthday } from './BirthdayPicker'
import { GenderPicker } from './GenderPicker'
import type { Gender } from './GenderPicker'
import { AvatarUpload } from './AvatarUpload'
import { useAuth } from '@/hooks/useAuth'
import { isOldEnough, MINIMUM_AGE } from '@/lib/age'

type Errors = Partial<Record<'birthday' | 'username' | 'email' | 'password' | 'confirm' | 'form', string>>

export function SignupForm({ onSent }: { onSent: (email: string) => void }) {
  const { signUp } = useAuth()

  const [birthday, setBirthday] = useState<Birthday>(emptyBirthday)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [displayNameTouched, setDisplayNameTouched] = useState(false)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [gender, setGender] = useState<Gender>('')
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)

  // The display name starts as a copy of the username and follows it until
  // the person edits it themselves.
  useEffect(() => {
    if (!displayNameTouched) setDisplayName(username)
  }, [username, displayNameTouched])

  const validate = () => {
    const found: Errors = {}
    const birthDate = birthdayToDate(birthday)

    if (!birthDate) found.birthday = 'Pick your birthday.'
    else if (!isOldEnough(birthDate)) found.birthday = `You need to be ${MINIMUM_AGE} or over to use Kobbleston.`

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      found.username = 'Letters, numbers and underscores. 3 to 20 characters.'
    }
    if (password.length < 8) found.password = 'At least 8 characters.'
    else if (password !== confirm) found.confirm = 'Both passwords need to match.'

    setErrors(found)
    return Object.keys(found).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setPending(true)
    try {
      await signUp({
        email,
        password,
        username,
        displayName: displayName.trim() || username,
        avatarFile: avatar,
        birthDate: birthdayToDate(birthday),
        gender,
      })
      onSent(email)
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'That did not go through. Try again.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <BirthdayPicker value={birthday} onChange={setBirthday} error={errors.birthday} />

      <Input
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        maxLength={20}
        error={errors.username}
        placeholder="3 to 20 characters, no spaces"
      />

      <Reveal when={username.length > 0}>
        <Input
          label="Display name"
          labelNote="what people see, you can change it"
          value={displayName}
          onChange={(e) => {
            setDisplayNameTouched(true)
            setDisplayName(e.target.value)
          }}
          maxLength={32}
        />
      </Reveal>

      <AvatarUpload file={avatar} onChange={setAvatar} />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        error={errors.email}
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        error={errors.password}
        placeholder="At least 8 characters"
      />

      <Reveal when={password.length > 0}>
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={errors.confirm}
        />
      </Reveal>

      <GenderPicker value={gender} onChange={setGender} />

      {errors.form && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errors.form}
        </p>
      )}

      <Button type="submit" size="lg" block loading={pending}>Sign Up</Button>

      <p className="text-center text-[11px] leading-relaxed text-muted">
        By clicking Sign Up you agree to our{' '}
        <Link to="/terms" className="font-semibold text-[#9fadff] hover:underline">Terms of Service</Link>
        {' '}and{' '}
        <Link to="/guidelines" className="font-semibold text-[#9fadff] hover:underline">Community Guidelines</Link>.
      </p>
    </form>
  )
}
