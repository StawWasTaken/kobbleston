import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { Kobby } from '@/components/brand/Kobby'
import { categoryLabels } from '@/components/spaces/SpaceCard'
import { useAuth } from '@/hooks/useAuth'
import { createSpace } from '@/lib/api'
import { slugify } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { SpaceCategory } from '@/types/db'

const categories = Object.keys(categoryLabels) as SpaceCategory[]

export default function CreateSpace() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<SpaceCategory>('personal')
  const [publish, setPublish] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveSlug = slugEdited ? slug : slugify(name)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!/^[a-z0-9-]{3,40}$/.test(effectiveSlug)) {
      setError('The address needs 3 to 40 lowercase letters, numbers or dashes.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const space = await createSpace({
        ownerId: profile.id,
        name: name.trim(),
        slug: effectiveSlug,
        description: description.trim(),
        category,
        publish,
      })
      toast(publish ? 'Space published.' : 'Draft saved.', 'success')
      navigate(`/u/${profile.username}/${space.slug}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'That did not save.'
      setError(message.includes('duplicate') ? 'You already have a Space at that address.' : message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Page className="max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Make a Space</h1>
        <p className="mt-1.5 text-muted">
          Name it, say what it is, publish it. You can change all of this later.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-5 p-5 sm:p-6">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={48}
            required
            placeholder="My extremely normal website"
          />

          <Input
            label="Address"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugEdited(true)
              setSlug(slugify(e.target.value))
            }}
            maxLength={40}
            hint={`kobbleston.com/u/${profile?.username ?? 'you'}/${effectiveSlug || '…'}`}
            error={error}
          />

          <Textarea
            label="What is it?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
            placeholder="A page about my cat. She has opinions."
            hint={`${description.length}/400`}
          />

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Category</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={cn(
                    'h-9 rounded-xl border px-3.5 text-sm font-semibold transition-colors',
                    category === c
                      ? 'border-brand-bright bg-brand text-white'
                      : 'border-ink-line bg-ink-raised text-white/65 hover:bg-ink-hover hover:text-white',
                  )}
                >
                  {categoryLabels[c]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-line bg-ink-raised p-4">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#1B34E8]"
            />
            <span>
              <span className="block text-sm font-semibold">Publish it straight away</span>
              <span className="mt-0.5 block text-xs text-muted">
                Published Spaces show up in Discover and anyone can enter them. Leave this off to
                keep it as a draft only you can see.
              </span>
            </span>
          </label>
        </Card>

        <Card className="flex flex-col items-center gap-4 p-5 sm:flex-row">
          <Kobby mood="construction" size="sm" />
          <p className="flex-1 text-sm text-muted">
            The Kobbleston editor isn&apos;t built yet, so for now a Space is its page, its
            address and its visitors. Building the inside comes next.
          </p>
          <Badge tone="warm">Coming</Badge>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" size="lg" loading={pending} iconRight={faArrowRightToBracket}>
            {publish ? 'Publish Space' : 'Save draft'}
          </Button>
        </div>
      </form>
    </Page>
  )
}
