import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileCode, faPlus, faTrash, faRotateLeft, faCloudArrowUp, faFloppyDisk,
  faDesktop, faMobileScreen, faCircleDot, faShapes, faCode, faEye,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { BackLink } from '@/components/ui/BackLink'
import { SiteFrame } from '@/components/spaces/SiteFrame'
import { Canvas } from '@/components/builder/Canvas'
import { Toolbox } from '@/components/builder/Toolbox'
import { Inspector } from '@/components/builder/Inspector'
import { compilePage, emptyPage, newBlock, readPage } from '@/lib/blocks'
import type { Block, BlockKind, Page } from '@/lib/blocks'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import {
  deleteSpaceFile, getSpaceById, listSpaceFiles, publishSpaceFiles, revertSpaceFiles,
  saveSpaceFile,
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
  button.props = { ...button.props, label: 'Look around Kobbleston', href: '/discover' }

  page.blocks = [heading, text, button]
  return page
}

const language = (path: string) =>
  path.endsWith('.css') ? 'Styles' : path.endsWith('.js') ? 'Script' : path.endsWith('.json') ? 'Blocks' : 'Markup'

export default function BuildSpace() {
  const { spaceId = '' } = useParams()
  const toast = useToast()

  const space = useAsync(() => getSpaceById(spaceId), [spaceId])
  const stored = useAsync(() => listSpaceFiles(spaceId, 'draft'), [spaceId])

  useTitle(space.data ? `Building ${space.data.name}` : 'Building')

  const [mode, setMode] = useState<'blocks' | 'files'>('blocks')
  const [files, setFiles] = useState<SpaceFile[]>([])
  const [page, setPage] = useState<Page | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [open, setOpen] = useState('index.html')
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [takingOver, setTakingOver] = useState(false)
  const [newName, setNewName] = useState('')
  const [wide, setWide] = useState(true)
  const editor = useRef<HTMLTextAreaElement>(null)

  /*
   * What is on screen starts as what is stored. A Space nobody has touched
   * starts as a page with something on it, built from blocks; one whose files
   * have been taken over by hand opens in Files, because the blocks no longer
   * own them.
   */
  useEffect(() => {
    if (!stored.data || !space.data) return

    if (stored.data.length) {
      setFiles(stored.data)
      const found = readPage(stored.data.find((file) => file.path === PAGE_FILE)?.content)
      setPage(found)
      setMode(found ? 'blocks' : 'files')
      setOpen(stored.data.find((f) => f.path === 'index.html')?.path ?? stored.data[0].path)
      return
    }

    const fresh = startingPage(space.data.name)
    const built = compilePage(fresh)
    const now = new Date().toISOString()
    setPage(fresh)
    setFiles([
      { path: PAGE_FILE, content: JSON.stringify(fresh), updated_at: now },
      { path: 'index.html', content: built.html, updated_at: now },
      { path: 'style.css', content: built.css, updated_at: now },
    ])
    setDirty({ [PAGE_FILE]: true, 'index.html': true, 'style.css': true })
  }, [stored.data, space.data])

  const current = files.find((file) => file.path === open) ?? files[0]
  const unsaved = useMemo(() => Object.values(dirty).some(Boolean), [dirty])
  const block = page?.blocks.find((one) => one.id === selected) ?? null

  /** A change to the blocks rewrites the two files they own. */
  const applyPage = (next: Page) => {
    setPage(next)
    const built = compilePage(next)
    const now = new Date().toISOString()

    setFiles((all) => {
      const others = all.filter(
        (file) => ![PAGE_FILE, 'index.html', 'style.css'].includes(file.path),
      )
      return [
        { path: PAGE_FILE, content: JSON.stringify(next), updated_at: now },
        { path: 'index.html', content: built.html, updated_at: now },
        { path: 'style.css', content: built.css, updated_at: now },
        ...others,
      ]
    })
    setDirty((all) => ({ ...all, [PAGE_FILE]: true, 'index.html': true, 'style.css': true }))
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

  const changeBlocks = (blocks: Block[]) => {
    if (!page) return
    applyPage({ ...page, blocks })
  }

  const removeBlock = () => {
    if (!page || !block) return
    applyPage({ ...page, blocks: page.blocks.filter((one) => one.id !== block.id) })
    setSelected(null)
  }

  const duplicateBlock = () => {
    if (!page || !block) return
    const copy = { ...block, id: `${block.kind}-${Math.random().toString(36).slice(2, 9)}`, x: block.x + 20, y: block.y + 20 }
    applyPage({ ...page, blocks: [...page.blocks, copy] })
    setSelected(copy.id)
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

  const changeFile = (content: string) => {
    if (!current) return
    setFiles((all) => all.map((file) => (file.path === current.path ? { ...file, content } : file)))
    setDirty((all) => ({ ...all, [current.path]: true }))
    if (current.path === PAGE_FILE) setPage(readPage(content))
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      for (const file of files) {
        if (dirty[file.path]) await saveSpaceFile(spaceId, file.path, file.content)
      }
      setDirty({})
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
      for (const file of files) {
        if (dirty[file.path]) await saveSpaceFile(spaceId, file.path, file.content)
      }
      setDirty({})
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

  /* Once the files are yours, the blocks stop owning them. One way. */
  const takeOverFiles = async () => {
    try {
      await deleteSpaceFile(spaceId, PAGE_FILE)
    } catch {
      // It may never have been saved, which does not matter here.
    }
    setFiles((all) => all.filter((file) => file.path !== PAGE_FILE))
    setPage(null)
    setMode('files')
    setTakingOver(false)
    toast('The files are yours now. Blocks will not overwrite them.', 'info')
  }

  const addFile = () => {
    const path = newName.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9._/-]{0,59}$/.test(path)) {
      toast('Letters, numbers, dots, dashes and slashes.', 'error')
      return
    }
    if (files.some((file) => file.path === path)) {
      toast('There is already a file called that.', 'error')
      return
    }
    setFiles((all) => [...all, { path, content: '', updated_at: new Date().toISOString() }])
    setDirty((all) => ({ ...all, [path]: true }))
    setOpen(path)
    setAdding(false)
    setNewName('')
    window.setTimeout(() => editor.current?.focus(), 50)
  }

  const removeFile = async (path: string) => {
    if (path === 'index.html') {
      toast('Every Space needs its index.html.', 'error')
      return
    }
    try {
      await deleteSpaceFile(spaceId, path)
    } catch {
      // It may never have been saved, which is not worth a message.
    }
    setFiles((all) => all.filter((file) => file.path !== path))
    setDirty((all) => ({ ...all, [path]: false }))
    if (open === path) setOpen('index.html')
  }

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

        <div className="flex items-center gap-1 rounded-xl border border-ink-line p-1">
          {([
            { key: 'blocks', icon: faShapes, label: 'Blocks' },
            { key: 'files', icon: faCode, label: 'Files' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => (tab.key === 'blocks' && !page ? setTakingOver(true) : setMode(tab.key))}
              aria-pressed={mode === tab.key}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                mode === tab.key ? 'bg-brand text-onbrand' : 'text-white/55 hover:text-white',
              )}
            >
              <FontAwesomeIcon icon={tab.icon} className="text-[11px]" />
              {tab.label}
            </button>
          ))}
        </div>

        <span className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted sm:flex">
          <FontAwesomeIcon icon={faCircleDot} className={cn(unsaved ? 'text-amber-300' : 'text-space')} />
          {unsaved ? 'Not saved' : 'Saved'}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {mode === 'blocks' && (
            <div className="hidden items-center gap-1 rounded-lg border border-ink-line px-1 lg:flex">
              {[0.5, 0.75, 1].map((level) => (
                <button
                  key={level}
                  onClick={() => setZoom(level)}
                  aria-pressed={zoom === level}
                  className={cn(
                    'rounded-md px-2 py-1 text-[11px] font-bold tabular-nums transition-colors',
                    zoom === level ? 'bg-brand text-onbrand' : 'text-white/50 hover:text-white',
                  )}
                >
                  {level * 100}%
                </button>
              ))}
            </div>
          )}

          {mode === 'files' && (
            <div className="hidden items-center gap-1 rounded-lg border border-ink-line p-1 lg:flex">
              {[
                { wide: true, icon: faDesktop, label: 'Wide' },
                { wide: false, icon: faMobileScreen, label: 'Narrow' },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => setWide(option.wide)}
                  aria-pressed={wide === option.wide}
                  aria-label={`${option.label} preview`}
                  className={cn(
                    'grid h-7 w-8 place-items-center rounded-md text-xs transition-colors',
                    wide === option.wide ? 'bg-brand text-onbrand' : 'text-white/50 hover:text-white',
                  )}
                >
                  <FontAwesomeIcon icon={option.icon} />
                </button>
              ))}
            </div>
          )}

          <Button size="sm" variant="ghost" icon={faRotateLeft} onClick={undoPublish}>
            Undo publish
          </Button>
          <Button
            size="sm"
            variant="subtle"
            icon={faFloppyDisk}
            loading={saving}
            disabled={!unsaved}
            onClick={saveAll}
          >
            Save
          </Button>
          <Button size="sm" variant="enter" icon={faCloudArrowUp} loading={publishing} onClick={publish}>
            Publish
          </Button>
        </div>
      </header>

      {/* -------------------------------------------------------- blocks */}
      {mode === 'blocks' && page && (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="w-full shrink-0 border-b border-ink-line lg:w-60 lg:border-b-0 lg:border-r">
            <Toolbox
              blocks={page.blocks}
              selected={selected}
              onInsert={insert}
              onSelect={setSelected}
            />
          </aside>

          <div className="min-h-[24rem] flex-1">
            <Canvas
              page={page}
              selected={selected}
              onSelect={setSelected}
              onChange={changeBlocks}
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

      {/* --------------------------------------------------------- files */}
      {mode === 'files' && (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="flex w-full shrink-0 flex-col border-b border-ink-line lg:w-56 lg:border-b-0 lg:border-r">
            <p className="px-4 pb-2 pt-3 text-[11px] font-extrabold uppercase tracking-wide text-muted">
              Files
            </p>

            <ul className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-y-auto kob-scroll">
              {files.map((file) => (
                <li key={file.path} className="group relative shrink-0 lg:shrink">
                  <button
                    onClick={() => setOpen(file.path)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors',
                      open === file.path ? 'bg-brand text-onbrand' : 'text-white/65 hover:bg-ink-hover hover:text-white',
                    )}
                  >
                    <FontAwesomeIcon icon={faFileCode} className="text-xs" />
                    <span className="truncate">{file.path}</span>
                    {dirty[file.path] && <span className="ml-auto text-amber-300">•</span>}
                  </button>

                  {file.path !== 'index.html' && (
                    <button
                      onClick={() => removeFile(file.path)}
                      aria-label={`Delete ${file.path}`}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-xs text-white/40 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="px-2 pb-3">
              <Button size="sm" variant="ghost" block icon={faPlus} onClick={() => setAdding(true)}>
                New file
              </Button>
            </div>
          </aside>

          <section className="flex min-h-0 w-full flex-1 flex-col border-b border-ink-line lg:w-1/2 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 border-b border-ink-line px-4 py-2">
              <span className="font-display text-sm font-extrabold">{current?.path}</span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
                {current ? language(current.path) : ''}
              </span>

              {page && (
                <span className="ml-auto text-[11px] text-amber-300">
                  Blocks rewrite index.html and style.css when you change them.
                </span>
              )}
            </div>

            <textarea
              ref={editor}
              value={current?.content ?? ''}
              onChange={(e) => changeFile(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-label={`${current?.path ?? 'File'} contents`}
              className="min-h-[18rem] flex-1 resize-none bg-ink-raised/40 p-4 font-mono text-[13px] leading-relaxed text-white/90 outline-none kob-scroll"
            />

            {page && (
              <div className="border-t border-ink-line p-3">
                <Button size="sm" variant="ghost" block onClick={() => setTakingOver(true)}>
                  Take the files over by hand
                </Button>
              </div>
            )}
          </section>

          <section className="flex min-h-0 w-full flex-1 flex-col lg:w-1/2">
            <div className="flex items-center gap-2 border-b border-ink-line px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
              <FontAwesomeIcon icon={faEye} />
              Preview
              <span className="ml-auto normal-case text-white/35">
                Your draft, not what is live.
              </span>
            </div>

            <div className="min-h-[18rem] flex-1 overflow-auto bg-ink-raised/40 p-4">
              <div className={cn('mx-auto h-full bg-white', wide ? 'w-full' : 'w-[22rem] max-w-full')}>
                <SiteFrame
                  files={files}
                  spaceId={spaceId}
                  title={`${space.data.name}, as you are building it`}
                  building
                />
              </div>
            </div>
          </section>
        </div>
      )}

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="New file"
        description="Markup, styles or script. The name decides which."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={addFile}>Make it</Button>
          </>
        }
      >
        <Input
          label="File name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="about.html"
          hint="Letters, numbers, dots, dashes and slashes."
        />
      </Dialog>

      <Dialog
        open={takingOver}
        onClose={() => setTakingOver(false)}
        title={page ? 'Take the files over' : 'Start again with blocks'}
        description={
          page
            ? 'The blocks will stop writing index.html and style.css.'
            : 'The files here were written by hand.'
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTakingOver(false)}>Cancel</Button>
            {page ? (
              <Button onClick={takeOverFiles}>Take them over</Button>
            ) : (
              <Button
                onClick={() => {
                  const fresh = startingPage(space.data?.name ?? 'My Space')
                  applyPage(fresh)
                  setMode('blocks')
                  setTakingOver(false)
                }}
              >
                Start with blocks
              </Button>
            )}
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          {page
            ? 'From then on the files are yours alone: what you write stays exactly as you wrote it, and the block editor will not overwrite it. You can start again with blocks later, but that replaces the page.'
            : 'Starting with blocks replaces index.html and style.css with a page built out of blocks. Anything else you have written is left alone.'}
        </p>
      </Dialog>
    </div>
  )
}
