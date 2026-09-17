import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { AssetRefPicker } from '@/components/create/AssetRefPicker'
import { ChatSettings } from '@/components/spaces/ChatSettings'
import { Collaborators } from '@/components/spaces/Collaborators'
import { categoryLabels } from '@/components/spaces/SpaceCard'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { getSpaceById, updateSpace } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { SpaceCategory } from '@/types/db'

const genres = ['other', 'personal', 'community', 'game', 'art', 'music', 'story', 'tools', 'fan']
const categories = Object.keys(categoryLabels) as SpaceCategory[]

export default function EditSpace() {
  const { spaceId = '' } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const space = useAsync(() => getSpaceById(spaceId), [spaceId])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<SpaceCategory>('personal')
  const [genre, setGenre] = useState('other')
  const [published, setPublished] = useState(false)
  const [emblem, setEmblem] = useState<string | null>(null)
  const [cover, setCover] = useState<string | null>(null)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [newShot, setNewShot] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const it = space.data
    if (!it) return
    setName(it.name)
    setDescription(it.description ?? '')
    setCategory(it.category)
    setGenre(it.genre)
    setPublished(it.is_published)
    setThumbnails(it.thumbnail_urls ?? [])
    setEmblem(it.emblem_url)
    setCover(it.cover_url)
  }, [space.data])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!space.data || !profile) return
    setPending(true)
    try {
      const [emblemUrl, coverUrl] = await Promise.all([
        Promise.resolve(emblem),
        Promise.resolve(cover),
      ])

      await updateSpace(space.data.id, {
        name: name.trim(),
        description: description.trim() || null,
        category,
        genre,
        is_published: published,
        emblem_url: emblemUrl,
        cover_url: coverUrl,
        thumbnail_urls: thumbnails,
      })
      toast('Saved.', 'success')
      space.reload()
      setEmblem(null)
      setCover(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    } finally {
      setPending(false)
    }
  }

  if (space.loading) return <Page><Skeleton className="h-64 w-full" /></Page>
  if (space.error) return <Page><ErrorState message={space.error} onRetry={space.reload} /></Page>
  if (!space.data || space.data.owner_id !== profile?.id) {
    return (
      <Page>
        <Card className="p-6">
          <p className="text-sm text-muted">This is not your Space to configure.</p>
        </Card>
      </Page>
    )
  }

  return (
    <Page className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Configure Space</h1>
        <p className="mt-1.5 text-muted">
          {space.data.name}{space.data.content_id ? ` · SPC-${space.data.content_id}` : ''}
        </p>
      </div>

      <form onSubmit={save} className="space-y-5">
        <Card className="space-y-5 p-5 sm:p-6">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={48} required />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
            hint={`${description.length}/400`}
          />

          <AssetRefPicker
            label="Emblem"
            value={emblem}
            onChange={setEmblem}
            note="The square icon people see in lists and inside the Space."
          />

          <AssetRefPicker
            label="Cover"
            value={cover}
            onChange={setCover}
            note="The wide picture at the top of the page."
          />

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Thumbnails</p>
            {!!thumbnails.length && (
              <div className="mb-3 flex flex-wrap gap-2">
                {thumbnails.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="h-16 w-28 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setThumbnails((all) => all.filter((x) => x !== url))}
                      aria-label="Remove this thumbnail"
                      className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink-card text-xs text-white/60 ring-1 ring-ink-line hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <AssetRefPicker
              label="Add one"
              value={newShot}
              onChange={(next) => {
                if (!next) { setNewShot(null); return }
                setThumbnails((all) => (all.includes(next) ? all : [...all, next]))
                setNewShot(null)
              }}
              note="Paste an ID, pick from what you can use, or upload a new picture."
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Category</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={cn(
                    'h-9 rounded-lg border px-3.5 text-sm font-bold transition-colors',
                    category === c
                      ? 'border-brand-bright bg-brand text-white'
                      : 'border-ink-line bg-ink-raised text-white/60 hover:bg-ink-hover hover:text-white',
                  )}
                >
                  {categoryLabels[c]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Genre</legend>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  aria-pressed={genre === g}
                  className={cn(
                    'h-9 rounded-lg border px-3.5 text-sm font-bold capitalize transition-colors',
                    genre === g
                      ? 'border-brand-bright bg-brand text-white'
                      : 'border-ink-line bg-ink-raised text-white/60 hover:bg-ink-hover hover:text-white',
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-line bg-ink-raised p-4">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#1B34E8]"
            />
            <span>
              <span className="block text-sm font-semibold">Published</span>
              <span className="mt-0.5 block text-xs text-muted">
                Unpublish and it disappears from Discover and nobody can enter.
              </span>
            </span>
          </label>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" icon={faTrash} onClick={() => navigate(-1)}>Back</Button>
          <Button type="submit" size="lg" loading={pending}>Save changes</Button>
        </div>
      </form>

      <section>
        <SectionHeading title="Chat" />
        <ChatSettings space={space.data} onSaved={space.reload} />
      </section>

      <section className="mt-8">
        <SectionHeading title="Team" />
        <Collaborators
          spaceId={space.data.id}
          ownerId={space.data.owner_id}
          viewerId={profile?.id}
        />
      </section>
    </Page>
  )
}
