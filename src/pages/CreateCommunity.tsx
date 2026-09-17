import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { ImageDrop } from '@/components/community/ImageDrop'
import { useAuth } from '@/hooks/useAuth'
import { createCommunityFull, uploadCommunityImage } from '@/lib/api'
import { slugify } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useTitle } from '@/hooks/useTitle'
import { Kube } from '@/components/brand/Kube'
import { BackLink } from '@/components/ui/BackLink'

const COST = 100

const policies = [
  { value: 'open', label: 'Anyone can join', note: 'People join straight away.' },
  { value: 'approval', label: 'Manual approval', note: 'You let people in one at a time.' },
] as const

export default function CreateCommunity() {
  useTitle('New Community')
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emblem, setEmblem] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [joinPolicy, setJoinPolicy] = useState<'open' | 'approval'>('open')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)
  const affordable = (profile?.pixels ?? 0) >= COST

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
      setError('The name needs at least three letters or numbers.')
      return
    }
    if (!emblem) {
      setError('An emblem is needed.')
      return
    }

    setPending(true)
    setError(null)
    try {
      const [iconUrl, bannerUrl] = await Promise.all([
        uploadCommunityImage(profile.id, emblem, 'emblem'),
        cover ? uploadCommunityImage(profile.id, cover, 'cover') : Promise.resolve(null),
      ])

      await createCommunityFull({ name, slug, description, iconUrl, bannerUrl, joinPolicy })
      await refreshProfile()
      toast('Community created.', 'success')
      navigate(`/c/${slug}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'That did not save.'
      setError(message.includes('duplicate') ? 'That name is taken.' : message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Page className="max-w-3xl">
      <BackLink to={'/communities'} className="mb-4">Back to Communities</BackLink>

      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Create Community</h1>
      <p className="mt-1.5 text-muted">
        A place for people building around the same thing.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Card className="space-y-5 p-5 sm:p-6">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            hint={`${name.length}/50${slug ? ` · kobbleston.com/c/${slug}` : ''}`}
            error={error}
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            className="min-h-[9rem]"
            hint={`${description.length}/1000`}
          />

          <ImageDrop
            label="Emblem"
            required
            file={emblem}
            onChange={setEmblem}
            note="Square works best. This is what people see everywhere."
          />

          <ImageDrop
            label="Cover photo"
            aspect="wide"
            file={cover}
            onChange={setCover}
            note="Wide, around 1440 by 456."
          />

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Joining
            </legend>
            <div className="space-y-2">
              {policies.map((policy) => (
                <label
                  key={policy.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                    joinPolicy === policy.value
                      ? 'border-brand-bright bg-brand/15'
                      : 'border-ink-line bg-ink-raised hover:bg-ink-hover',
                  )}
                >
                  <input
                    type="radio"
                    name="join-policy"
                    value={policy.value}
                    checked={joinPolicy === policy.value}
                    onChange={() => setJoinPolicy(policy.value)}
                    className="mt-0.5 accent-[#1B34E8]"
                  />
                  <span>
                    <span className="block text-sm font-bold">{policy.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{policy.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {!affordable && (
            <p className="mr-auto text-sm text-danger">
              You need <Kube className="text-link" /> {COST}. You have {profile?.pixels ?? 0}.
            </p>
          )}
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" size="lg" loading={pending} disabled={!affordable}>
            <Kube />
            {COST}
          </Button>
        </div>
      </form>
    </Page>
  )
}
