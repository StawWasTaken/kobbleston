import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCubes, faRightFromBracket, faUser, faLock, faShieldHalved, faPen, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/States'
import { AvatarUpload } from '@/components/auth/AvatarUpload'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import {
  USERNAME_CHANGE_COST, changeUsername, listPixelTransactions, updateProfile,
  uploadAvatar, usernameHistory,
} from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { formatCount, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

type Section = 'Account info' | 'Security' | 'Pixels' | 'Safety'

const sections: { name: Section; icon: IconDefinition }[] = [
  { name: 'Account info', icon: faUser },
  { name: 'Security', icon: faLock },
  { name: 'Pixels', icon: faCubes },
  { name: 'Safety', icon: faShieldHalved },
]

/** A labelled line with whatever it takes to change it on the right. */
function Row({ label, value, action }: {
  label: string
  value: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <div className="truncate text-sm text-muted">{value}</div>
      </div>
      {action}
    </div>
  )
}

/* ----------------------------------------------------------- account info */

function AccountInfo() {
  const { profile, session, refreshProfile } = useAuth()
  const toast = useToast()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [renamePending, setRenamePending] = useState(false)

  const history = useAsync(
    async () => (profile ? usernameHistory(profile.id) : []),
    [profile?.id, profile?.username],
  )

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name)
    setBio(profile.bio ?? '')
  }, [profile])

  if (!profile) return <Skeleton className="h-64" />

  const affordable = profile.pixels >= USERNAME_CHANGE_COST

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    try {
      const avatar_url = avatarFile ? await uploadAvatar(profile.id, avatarFile) : profile.avatar_url
      await updateProfile(profile.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url,
      })
      setAvatarFile(null)
      await refreshProfile()
      toast('Saved.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    } finally {
      setPending(false)
    }
  }

  const rename = async () => {
    setRenamePending(true)
    try {
      const name = await changeUsername(newName.trim())
      await refreshProfile()
      history.reload()
      setRenaming(false)
      setNewName('')
      toast(`You are @${name} now.`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not work.', 'error')
    } finally {
      setRenamePending(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="space-y-4">
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {!avatarFile && profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl border border-ink-line object-cover"
              />
            )}
            <AvatarUpload
              file={avatarFile}
              onChange={setAvatarFile}
              note="Upload a new one to replace what you have."
              className="flex-1"
            />
          </div>

          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={32}
            required
          />

          <Textarea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            placeholder="Say something about yourself."
            hint={`${bio.length}/300`}
          />

          <div className="flex justify-end">
            <Button type="submit" loading={pending}>Save changes</Button>
          </div>
        </Card>
      </form>

      <Card className="divide-y divide-ink-line">
        <Row
          label="Username"
          value={`@${profile.username}`}
          action={
            <Button size="sm" variant="subtle" icon={faPen} onClick={() => setRenaming(true)}>
              Change
            </Button>
          }
        />
        <Row label="Email" value={session?.user.email ?? 'Not set'} />
        {profile.birth_date && (
          <Row
            label="Birthday"
            value={new Date(profile.birth_date).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          />
        )}
        {!!history.data?.length && (
          <Row
            label="Names you have used"
            value={history.data.map((row) => `@${row.username}`).join(', ')}
          />
        )}
      </Card>

      <Dialog
        open={renaming}
        onClose={() => setRenaming(false)}
        title="Change your username"
        description={`It costs ${USERNAME_CHANGE_COST} Pixels, and your old names stay on your profile.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(false)}>Cancel</Button>
            <Button
              loading={renamePending}
              disabled={!affordable || newName.trim().length < 3}
              onClick={rename}
            >
              Pay {USERNAME_CHANGE_COST} Pixels
            </Button>
          </>
        }
      >
        <Input
          label="New username"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={16}
          placeholder={profile.username}
          hint="3 to 16 letters, numbers or underscores."
        />
        <p className={cn('mt-3 text-sm', affordable ? 'text-muted' : 'text-red-300')}>
          You have {formatCount(profile.pixels)} Pixels.
          {!affordable && ` You need ${USERNAME_CHANGE_COST}.`}
        </p>
      </Dialog>
    </div>
  )
}

/* --------------------------------------------------------------- security */

function Security() {
  const { signOut } = useAuth()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)

  const change = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast('Use at least 8 characters.', 'error'); return }
    if (password !== confirm) { toast('The two do not match.', 'error'); return }
    setPending(true)
    const { error } = await supabase.auth.updateUser({ password })
    setPending(false)
    if (error) { toast(error.message, 'error'); return }
    setPassword('')
    setConfirm('')
    toast('Password changed.', 'success')
  }

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold">Password</h2>
        <form onSubmit={change} className="mt-4 space-y-4">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {password.length > 0 && (
            <Input
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              icon={password && password === confirm ? faCheck : undefined}
            />
          )}
          <div className="flex justify-end">
            <Button type="submit" loading={pending} disabled={!password}>Change password</Button>
          </div>
        </form>
      </Card>

      <Card className="divide-y divide-ink-line">
        <Row
          label="Log out"
          value="Ends this session on this device."
          action={
            <Button variant="subtle" icon={faRightFromBracket} onClick={signOut}>Log out</Button>
          }
        />
      </Card>
    </div>
  )
}

/* ----------------------------------------------------------------- pixels */

function Pixels() {
  const { profile } = useAuth()
  const ledger = useAsync(
    async () => (profile ? listPixelTransactions(profile.id) : []),
    [profile?.id],
  )

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-ink-line px-5 py-4">
        <FontAwesomeIcon icon={faCubes} className="text-lg text-[#9fadff]" />
        <p className="font-display text-2xl font-extrabold tabular-nums">
          {formatCount(profile?.pixels ?? 0)}
        </p>
        <p className="text-sm text-muted">Pixels</p>
      </div>

      {ledger.loading && (
        <div className="space-y-2 p-4">
          {[0, 1].map((i) => <Skeleton key={i} className="h-10" />)}
        </div>
      )}

      {!ledger.loading && !ledger.data?.length && (
        <p className="px-5 py-6 text-center text-sm text-muted">Nothing has moved yet.</p>
      )}

      {!!ledger.data?.length && (
        <ul>
          {ledger.data.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 border-b border-ink-line/70 px-5 py-3 last:border-0"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{entry.note ?? entry.kind}</span>
                <span className="block text-xs text-muted">{timeAgo(entry.created_at)}</span>
              </span>
              <span
                className={cn(
                  'font-display text-sm font-extrabold tabular-nums',
                  entry.amount > 0 ? 'text-space-bright' : 'text-white/60',
                )}
              >
                {entry.amount > 0 ? '+' : ''}{entry.amount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ----------------------------------------------------------------- safety */

function Safety() {
  return (
    <Card className="space-y-3 p-5 text-sm leading-relaxed text-white/65">
      <p>
        Kobbleston is for people aged 15 and over. Report anything that should not be here
        using the flag on a profile or Space. Reports go straight to moderators, and the
        person you report is not told who reported them.
      </p>
      <p>
        Harassment, threats, sexual content involving minors, spam and impersonation get
        content removed and accounts suspended.
      </p>
    </Card>
  )
}

/* ------------------------------------------------------------------- page */

export default function Settings() {
  const [section, setSection] = useState<Section>('Account info')

  return (
    <Page className="max-w-5xl">
      <h1 className="mb-6 font-display text-3xl font-extrabold sm:text-4xl">Settings</h1>

      <div className="grid gap-6 md:grid-cols-[13rem_1fr] md:items-start">
        <nav aria-label="Settings sections" className="rounded-xl border border-ink-line bg-ink-card p-1.5">
          {sections.map((item) => (
            <button
              key={item.name}
              onClick={() => setSection(item.name)}
              aria-current={section === item.name ? 'page' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                section === item.name
                  ? 'bg-brand text-white'
                  : 'text-white/65 hover:bg-ink-hover hover:text-white',
              )}
            >
              <FontAwesomeIcon icon={item.icon} className="w-4 text-xs opacity-70" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {section === 'Account info' && <AccountInfo />}
          {section === 'Security' && <Security />}
          {section === 'Pixels' && <Pixels />}
          {section === 'Safety' && <Safety />}
        </div>
      </div>
    </Page>
  )
}
