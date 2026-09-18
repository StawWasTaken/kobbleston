import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileCode, faPlus, faTrash, faRotateLeft, faCloudArrowUp, faFloppyDisk,
  faDesktop, faMobileScreen, faCircleDot,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { BackLink } from '@/components/ui/BackLink'
import { SiteFrame } from '@/components/spaces/SiteFrame'
import { useAsync } from '@/hooks/useAsync'
import { useTitle } from '@/hooks/useTitle'
import {
  deleteSpaceFile, getSpaceById, listSpaceFiles, publishSpaceFiles, revertSpaceFiles,
  saveSpaceFile,
} from '@/lib/api'
import type { SpaceFile } from '@/lib/api'
import { spaceLink } from '@/lib/links'
import { cn } from '@/lib/cn'

/* What a Space starts as, so nobody meets an empty box. */
const STARTER: Record<string, string> = {
  'index.html': `<link rel="stylesheet" href="style.css" />

<main>
  <h1>Hello</h1>
  <p>This is my Space. It is mine and it can be as strange as I like.</p>

  <p class="hint">
    Everything you see is in the files on the left. Change one and the
    preview follows.
  </p>
</main>

<script src="script.js"></script>
`,
  'style.css': `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #101012;
  color: #f4f4f6;
}

main {
  max-width: 34rem;
  margin: 0 auto;
  padding: 4rem 1.5rem;
}

h1 {
  font-size: 3rem;
  line-height: 1;
  margin: 0 0 1rem;
}

.hint {
  color: #8b8b95;
  font-size: 0.9rem;
}
`,
  'script.js': `document.querySelector('h1')?.addEventListener('click', (event) => {
  event.target.textContent = 'Hello again'
})
`,
}

const language = (path: string) =>
  path.endsWith('.css') ? 'Styles' : path.endsWith('.js') ? 'Script' : 'Markup'

export default function BuildSpace() {
  const { spaceId = '' } = useParams()
  const toast = useToast()

  const space = useAsync(() => getSpaceById(spaceId), [spaceId])
  const saved = useAsync(() => listSpaceFiles(spaceId, 'draft'), [spaceId])

  useTitle(space.data ? `Building ${space.data.name}` : 'Building')

  const [files, setFiles] = useState<SpaceFile[]>([])
  const [open, setOpen] = useState('index.html')
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [wide, setWide] = useState(true)
  const editor = useRef<HTMLTextAreaElement>(null)

  // What is on screen starts as what is stored, and a Space with nothing in
  // it starts as something to change rather than an empty page.
  useEffect(() => {
    if (!saved.data) return
    if (saved.data.length) {
      setFiles(saved.data)
      setOpen(saved.data[0]?.path ?? 'index.html')
      return
    }
    setFiles(Object.entries(STARTER).map(([path, content]) => ({
      path,
      content,
      updated_at: new Date().toISOString(),
    })))
    setDirty(Object.fromEntries(Object.keys(STARTER).map((path) => [path, true])))
  }, [saved.data])

  const current = files.find((file) => file.path === open) ?? files[0]
  const unsaved = useMemo(() => Object.values(dirty).some(Boolean), [dirty])

  const change = (content: string) => {
    if (!current) return
    setFiles((all) => all.map((file) => (file.path === current.path ? { ...file, content } : file)))
    setDirty((all) => ({ ...all, [current.path]: true }))
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      for (const file of files) {
        if (dirty[file.path]) await saveSpaceFile(spaceId, file.path, file.content)
      }
      setDirty({})
      toast('Saved to your draft.', 'success')
      saved.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    setPublishing(true)
    try {
      if (unsaved) {
        for (const file of files) {
          if (dirty[file.path]) await saveSpaceFile(spaceId, file.path, file.content)
        }
        setDirty({})
      }
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

  const add = async () => {
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

  const remove = async (path: string) => {
    if (path === 'index.html') {
      toast('Every Space needs its index.html.', 'error')
      return
    }
    try {
      await deleteSpaceFile(spaceId, path)
    } catch {
      // It may never have been saved, which is not a problem worth a message.
    }
    setFiles((all) => all.filter((file) => file.path !== path))
    setDirty((all) => ({ ...all, [path]: false }))
    if (open === path) setOpen('index.html')
  }

  if (space.loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-[70vh] w-full rounded-2xl" />
      </div>
    )
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
      <header className="flex flex-wrap items-center gap-3 border-b border-ink-line px-4 py-3 sm:px-6">
        <BackLink to={spaceLink(space.data)}>{space.data.name}</BackLink>

        <span className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted sm:flex">
          <FontAwesomeIcon icon={faCircleDot} className={cn(unsaved ? 'text-amber-300' : 'text-space')} />
          {unsaved ? 'Not saved' : 'Saved'}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
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

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ------------------------------------------------------- files */}
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
                    onClick={() => remove(file.path)}
                    aria-label={`Delete ${file.path}`}
                    className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-md p-1.5 text-xs text-white/40 hover:text-danger group-hover:block lg:block lg:opacity-0 lg:group-hover:opacity-100"
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

        {/* ------------------------------------------------------ editor */}
        <section className="flex min-h-0 w-full flex-1 flex-col border-b border-ink-line lg:w-1/2 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 border-b border-ink-line px-4 py-2">
            <span className="font-display text-sm font-extrabold">{current?.path}</span>
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
              {current ? language(current.path) : ''}
            </span>
          </div>

          <textarea
            ref={editor}
            value={current?.content ?? ''}
            onChange={(e) => change(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={`${current?.path ?? 'File'} contents`}
            className="min-h-[18rem] flex-1 resize-none bg-ink-raised/40 p-4 font-mono text-[13px] leading-relaxed text-white/90 outline-none kob-scroll"
          />
        </section>

        {/* ----------------------------------------------------- preview */}
        <section className="flex min-h-0 w-full flex-1 flex-col lg:w-1/2">
          <div className="flex items-center gap-2 border-b border-ink-line px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
            Preview
            <span className="ml-auto normal-case text-white/35">
              What you are looking at is your draft, not what is live.
            </span>
          </div>

          <div className="min-h-[18rem] flex-1 overflow-auto bg-ink-raised/40 p-4">
            <div className={cn('mx-auto h-full bg-white', wide ? 'w-full' : 'w-[22rem] max-w-full')}>
              <SiteFrame files={files} title={`${space.data.name}, as you are building it`} />
            </div>
          </div>
        </section>
      </div>

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="New file"
        description="Markup, styles or script. The name decides which."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={add}>Make it</Button>
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
    </div>
  )
}
