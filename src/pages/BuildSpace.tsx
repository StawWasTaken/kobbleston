import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRotateLeft, faCloudArrowUp, faFloppyDisk, faCircleDot, faEye, faComments,
  faMagnifyingGlassMinus, faMagnifyingGlassPlus,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { BackLink } from '@/components/ui/BackLink'
import { SiteFrame } from '@/components/spaces/SiteFrame'
import { ChatSettings } from '@/components/spaces/ChatSettings'
import { Canvas } from '@/components/builder/Canvas'
import { Toolbox } from '@/components/builder/Toolbox'
import { Inspector } from '@/components/builder/Inspector'
import { compilePage, emptyPage, newBlock, readPage } from '@/lib/blocks'
import type { Block, BlockKind, Page } from '@/lib/blocks'
import { useAsync } from '@/hooks/useAsync'
import { CREATE_ICON, useFavicon, useTitle } from '@/hooks/useTitle'
import {
  getSpaceById, listSpaceFiles, publishSpaceFiles, revertSpaceFiles, saveSpaceFile,
} from '@/lib/api'
import type { SpaceFile } from '@/lib/api'
import { spaceLink } from '@/lib/links'
import { cn } from '@/lib/cn'

/** Where the blocks live. The markup and styles are made from this. */
const PAGE_FILE = 'page.json'

/** A page that already says something, so nobody starts at a blank canvas. */
function startingPage(name: string): Page {
  const page = emptyPage()
  const heading = newBlock('heading', { x: 60, y: 60 })
  const text = newBlock('text', { x: 60, y: 160 })
  const button = newBlock('button', { x: 60, y: 300 })

  heading.props = { ...heading.props, text: name, size: 52 }
  text.props = {
    ...text.props,
    text: 'This is my Space. It is mine, and it can be as strange as I like.',
  }
  button.props = { ...button.props, label: 'Look around Kobblon', href: '/discover' }

  page.blocks = [heading, text, button]
  return page
}

export default function BuildSpace() {
  const { spaceId = '' } = useParams()
  const toast = useToast()

  const space = useAsync(() => getSpaceById(spaceId), [spaceId])
  const stored = useAsync(() => listSpaceFiles(spaceId, 'draft'), [spaceId])

  useTitle(space.data ? `Building ${space.data.name}` : 'Building')
  // Building a Space is Create's work, so the tab wears Create's mark.
  useFavicon(CREATE_ICON)

  const [files, setFiles] = useState<SpaceFile[]>([])
  const [page, setPage] = useState<Page | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [looking, setLooking] = useState(false)
  const [talking, setTalking] = useState(false)

  /*
   * What is on screen starts as what is stored. A Space nobody has touched
   * starts as a page with something on it rather than a blank canvas, and one
   * built before blocks existed is read back from its page.json.
   */
  useEffect(() => {
    if (!stored.data || !space.data) return

    const found = readPage(stored.data.find((file) => file.path === PAGE_FILE)?.content)
    if (found) {
      setPage(found)
      setFiles(stored.data)
      return
    }

    const fresh = startingPage(space.data.name)
    setPage(fresh)
    setFiles(write(fresh, stored.data))
    setDirty(true)
  }, [stored.data, space.data])

  /** The three files the blocks own, beside anything else a Space holds. */
  function write(next: Page, existing: SpaceFile[]): SpaceFile[] {
    const built = compilePage(next)
    const now = new Date().toISOString()
    const others = existing.filter(
      (file) => ![PAGE_FILE, 'index.html', 'style.css'].includes(file.path),
    )
    return [
      { path: PAGE_FILE, content: JSON.stringify(next), updated_at: now },
      { path: 'index.html', content: built.html, updated_at: now },
      { path: 'style.css', content: built.css, updated_at: now },
      ...others,
    ]
  }

  const block = page?.blocks.find((one) => one.id === selected) ?? null

  const applyPage = (next: Page) => {
    setPage(next)
    setFiles((all) => write(next, all))
    setDirty(true)
  }

  const insert = (kind: BlockKind) => {
    if (!page) return
    // New blocks land under whatever is already there rather than on top of it.
    const lowest = page.blocks.reduce((low, one) => Math.max(low, one.y + one.h), 40)
    const made = newBlock(kind, { x: 60, y: lowest + 20 })
    applyPage({ ...page, blocks: [...page.blocks, made] })
    setSelected(made.id)
  }

  const changeBlock = (next: Block) => {
    if (!page) return
    applyPage({ ...page, blocks: page.blocks.map((one) => (one.id === next.id ? next : one)) })
  }

  const removeBlock = () => {
    if (!page || !block) return
    applyPage({ ...page, blocks: page.blocks.filter((one) => one.id !== block.id) })
    setSelected(null)
  }

  const duplicateBlock = () => {
    if (!page || !block) return
    const copy = {
      ...block,
      id: `${block.kind}-${Math.random().toString(36).slice(2, 9)}`,
      x: block.x + 20,
      y: block.y + 20,
    }
    applyPage({ ...page, blocks: [...page.blocks, copy] })
    setSelected(copy.id)
  }

  const lock = (id: string, locked: boolean) => {
    if (!page) return
    applyPage({ ...page, blocks: page.blocks.map((one) => (one.id === id ? { ...one, locked } : one)) })
  }

  /** Later in the list is drawn on top, so layering is just reordering. */
  const layer = (direction: 1 | -1) => {
    if (!page || !block) return
    const at = page.blocks.findIndex((one) => one.id === block.id)
    const to = at + direction
    if (to < 0 || to >= page.blocks.length) return
    const blocks = [...page.blocks]
    const [moved] = blocks.splice(at, 1)
    blocks.splice(to, 0, moved)
    applyPage({ ...page, blocks })
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      for (const file of files.slice(0, 3)) {
        await saveSpaceFile(spaceId, file.path, file.content)
      }
      setDirty(false)
      toast('Saved to your draft.', 'success')
      stored.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    setPublishing(true)
    try {
      for (const file of files.slice(0, 3)) {
        await saveSpaceFile(spaceId, file.path, file.content)
      }
      setDirty(false)
      const count = await publishSpaceFiles(spaceId)
      toast(`Published. ${count} ${count === 1 ? 'file is' : 'files are'} live.`, 'success')
      space.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not publish.', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const undoPublish = async () => {
    try {
      await revertSpaceFiles(spaceId)
      toast('Put back the version that was live before.', 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'There was nothing to go back to.', 'error')
    }
  }

  const count = useMemo(() => page?.blocks.length ?? 0, [page])

  if (space.loading) {
    return <div className="p-6"><Skeleton className="h-[70vh] w-full rounded-2xl" /></div>
  }

  if (space.error || !space.data) {
    return (
      <div className="p-6">
        <ErrorState message={space.error ?? 'That Space is not here.'} onRetry={space.reload} />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* ---------------------------------------------------------- top */}
      <header className="flex flex-wrap items-center gap-3 border-b border-ink-line px-4 py-2.5 sm:px-6">
        <BackLink to={spaceLink(space.data)}>{space.data.name}</BackLink>

        <span className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted sm:flex">
          <FontAwesomeIcon icon={faCircleDot} className={cn(dirty ? 'text-amber-300' : 'text-space')} />
          {dirty ? 'Not saved' : 'Saved'}
          <span className="text-white/35">
            · {count} {count === 1 ? 'block' : 'blocks'}
          </span>
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-0.5 rounded-lg border border-ink-line px-1 py-0.5 lg:flex">
            <button
              onClick={() => setZoom((level) => Math.max(0.25, Math.round((level - 0.25) * 100) / 100))}
              aria-label="Smaller"
              className="grid h-6 w-6 place-items-center rounded-md text-white/50 hover:text-white"
            >
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} className="text-[11px]" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="w-12 rounded-md px-1 py-0.5 text-[11px] font-bold tabular-nums text-white/70 hover:text-white"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((level) => Math.min(1.5, Math.round((level + 0.25) * 100) / 100))}
              aria-label="Bigger"
              className="grid h-6 w-6 place-items-center rounded-md text-white/50 hover:text-white"
            >
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="text-[11px]" />
            </button>
          </div>

          <Button size="sm" variant="ghost" icon={faComments} onClick={() => setTalking(true)}>
            Chat
          </Button>

          <Button size="sm" variant="ghost" icon={faEye} onClick={() => setLooking(true)}>
            Preview
          </Button>
          <Button size="sm" variant="ghost" icon={faRotateLeft} onClick={undoPublish}>
            Undo publish
          </Button>
          <Button
            size="sm"
            variant="subtle"
            icon={faFloppyDisk}
            loading={saving}
            disabled={!dirty}
            onClick={saveAll}
          >
            Save
          </Button>
          <Button size="sm" variant="enter" icon={faCloudArrowUp} loading={publishing} onClick={publish}>
            Publish
          </Button>
        </div>
      </header>

      {/* ------------------------------------------------------- building */}
      {page && (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="w-full shrink-0 border-b border-ink-line lg:w-60 lg:border-b-0 lg:border-r">
            <Toolbox
              blocks={page.blocks}
              selected={selected}
              onInsert={insert}
              onSelect={setSelected}
              onLock={lock}
            />
          </aside>

          <div className="min-h-[24rem] flex-1">
            <Canvas
              page={page}
              selected={selected}
              onSelect={setSelected}
              onChange={(blocks) => applyPage({ ...page, blocks })}
              zoom={zoom}
            />
          </div>

          <aside className="w-full shrink-0 overflow-y-auto border-t border-ink-line lg:w-72 lg:border-l lg:border-t-0 kob-scroll">
            <Inspector
              page={page}
              block={block}
              onPage={applyPage}
              onBlock={changeBlock}
              onRemove={removeBlock}
              onDuplicate={duplicateBlock}
              onLayer={layer}
            />
          </aside>
        </div>
      )}

      {/* Chat belongs to the Space, so it is set up where the Space is built
          rather than somewhere else entirely. */}
      <Dialog
        open={talking}
        onClose={() => setTalking(false)}
        title="Chat in this Space"
        description="Who can talk here, what they see when they walk in, and how fast."
        size="md"
      >
        {space.data && <ChatSettings space={space.data} onSaved={space.reload} />}
      </Dialog>

      {/* The page as a visitor gets it, rather than as a canvas. */}
      <Dialog
        open={looking}
        onClose={() => setLooking(false)}
        title="How it looks"
        description="Your draft, drawn the way a visitor would get it."
        size="lg"
      >
        <div className="h-[60vh] overflow-hidden rounded-xl bg-white">
          <SiteFrame files={files} title={`${space.data.name}, as you are building it`} building />
        </div>
      </Dialog>
    </div>
  )
}
