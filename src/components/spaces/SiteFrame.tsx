import { useEffect, useMemo, useState } from 'react'
import { isAssetRef, resolveAssetRef } from '@/lib/api'
import type { SpaceFile } from '@/lib/api'
import { cn } from '@/lib/cn'

/*
 * What a Space is allowed to do while it is being shown.
 *
 * The frame is sandboxed with scripts only and no same origin, so the page
 * inside has an origin of its own that matches nothing: it cannot read this
 * page, its storage, or anybody's session, whatever it tries. The policy
 * below is the second wall. Pictures and sounds have already been turned
 * into short lived links to our own storage before they get here, so
 * everything else is refused outright: no fetching, no third party scripts,
 * no frames, nothing sent anywhere.
 */
const POLICY = [
  "default-src 'none'",
  "img-src https: data: blob:",
  "media-src https: blob:",
  "font-src https: data:",
  "style-src 'unsafe-inline' https:",
  "script-src 'unsafe-inline'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
  "connect-src 'none'",
].join('; ')

const escapeForAttribute = (value: string) => value.replace(/"/g, '&quot;')

/** Every kob:// reference in the files, so each is only looked up once. */
function referencesIn(files: SpaceFile[]) {
  const found = new Set<string>()
  for (const file of files) {
    for (const match of file.content.matchAll(/kob:\/\/[A-Za-z]{3}-\d+/g)) {
      found.add(match[0].toLowerCase().replace(/^kob:\/\//, 'kob://'))
      found.add(match[0])
    }
  }
  return [...found]
}

/**
 * Builds the one document a Space is shown as.
 *
 * The files are not served over HTTP, so a stylesheet or a script the page
 * asks for by name is put into the document itself: `style.css` next to
 * `index.html` behaves the way somebody writing it would expect.
 */
function buildDocument(files: SpaceFile[], links: Map<string, string>) {
  const byPath = new Map(files.map((file) => [file.path, file.content]))
  let html = byPath.get('index.html') ?? ''

  // A stylesheet or script the page names is put in where it was named.
  html = html.replace(
    /<link\b[^>]*href=["']\.?\/?([a-z0-9._/-]+\.css)["'][^>]*>/gi,
    (whole, path: string) => {
      const css = byPath.get(path.toLowerCase())
      return css === undefined ? whole : `<style>\n${css}\n</style>`
    },
  )
  html = html.replace(
    /<script\b[^>]*src=["']\.?\/?([a-z0-9._/-]+\.js)["'][^>]*><\/script>/gi,
    (whole, path: string) => {
      const js = byPath.get(path.toLowerCase())
      return js === undefined ? whole : `<script>\n${js}\n</script>`
    },
  )

  // Content is referenced by its number, never copied, so this is where a
  // number becomes something the browser can actually load.
  for (const [reference, url] of links) {
    html = html.split(reference).join(escapeForAttribute(url))
  }

  // Anything still pointing at a number never resolved: better an empty
  // picture than a broken address that says kob:// in the page.
  html = html.replace(/kob:\/\/[A-Za-z]{3}-\d+/g, '')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${escapeForAttribute(POLICY)}" />
<style>html,body{margin:0;min-height:100%;background:#fff;color:#111;font-family:system-ui,sans-serif}</style>
</head>
<body>
${html}
</body>
</html>`
}

/**
 * A Space, shown the way a visitor sees it: its own files, in a frame that
 * can do nothing but draw them.
 */
export function SiteFrame({
  files, title, className,
}: {
  files: SpaceFile[]
  title: string
  className?: string
}) {
  const [links, setLinks] = useState<Map<string, string>>(new Map())

  const references = useMemo(() => referencesIn(files), [files])

  useEffect(() => {
    let live = true
    if (!references.length) { setLinks(new Map()); return }

    Promise.all(references.map(async (reference) => {
      if (!isAssetRef(reference)) return [reference, null] as const
      return [reference, await resolveAssetRef(reference).catch(() => null)] as const
    })).then((pairs) => {
      if (!live) return
      setLinks(new Map(pairs.filter(([, url]) => !!url) as [string, string][]))
    })

    return () => { live = false }
  }, [references])

  const document = useMemo(() => buildDocument(files, links), [files, links])

  return (
    <iframe
      title={title}
      srcDoc={document}
      // Scripts, and nothing else: no same origin, no forms, no popups, no
      // navigating the page that holds it.
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      className={cn('h-full w-full border-0 bg-white', className)}
    />
  )
}
