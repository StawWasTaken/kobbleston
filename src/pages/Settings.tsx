import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCubes } from '@fortawesome/free-solid-svg-icons'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/States'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/auth/AvatarUpload'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { listPixelTransactions, updateProfile, uploadAvatar } from '@/lib/api'
import { useAsync } from '@/hooks/useAsync'
import { formatCount, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

export default function Settings() {
  const { profile, session, refreshProfile, signOut } = useAuth()
  const toast = useToast()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ledger = useAsync(
    async () => (profile ? listPixelTransactions(profile.id) : []),
    [profile?.id],
  )

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name)
    setUsername(profile.username)
    setBio(profile.bio ?? '')
  }, [profile])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Letters, numbers and underscores. 3 to 20 characters.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const avatar_url = avatarFile
        ? await uploadAvatar(profile.id, avatarFile)
        : profile.avatar_url

      await updateProfile(profile.id, {
        display_name: displayName.trim(),
        username,
        bio: bio.trim() || null,
        avatar_url,
      })
      setAvatarFile(null)
      await refreshProfile()
      toast('Saved.', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'That did not save.'
      setError(message.includes('duplicate') ? 'That @name is taken.' : message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Page className="max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Settings</h1>
        <p className="mt-1.5 text-muted">How you show up on Kobbleston.</p>
      </header>

      <form onSubmit={save} className="space-y-4">
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {!avatarFile && profile?.avatar_url && (
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

          <Input
            label="@name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            required
            error={error}
            hint={`kobbleston.com/u/${username || '…'}`}
          />

          <Textarea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            placeholder="Say something about yourself."
            hint={`${bio.length}/300`}
          />
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={pending}>Save changes</Button>
        </div>
      </form>

      <section>
        <SectionHeading title="Account" />
        <Card className="divide-y divide-ink-line">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Email</p>
              <p className="truncate text-sm text-muted">{session?.user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-semibold">Log out</p>
              <p className="text-sm text-muted">Ends this session on this device.</p>
            </div>
            <Button variant="subtle" icon={faRightFromBracket} onClick={signOut}>Log out</Button>
          </div>
        </Card>
      </section>

      <section id="pixels">
        <SectionHeading title="Pixels" />
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
      </section>

      <section>
        <SectionHeading title="Safety" />
        <Card className="space-y-3 p-5 text-sm leading-relaxed text-white/65">
          <p>
            Kobbleston is for people aged 15 and over. Report anything that shouldn&apos;t be
            here using the flag on a profile or Space, reports go straight to moderators and
            the person you report isn&apos;t told who reported them.
          </p>
          <p>
            Harassment, threats, sexual content involving minors, spam and impersonation get
            content removed and accounts suspended.
          </p>
        </Card>
      </section>
    </Page>
  )
}
