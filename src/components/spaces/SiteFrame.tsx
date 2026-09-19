import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Kube } from '@/components/brand/Kube'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import {
  assetUrl, donateToSpace, isAssetRef, pickAd, recordAdClick, resolveAssetRef,
} from '@/lib/api'
import type { AdSize, ShownAd, SpaceFile } from '@/lib/api'
import { currency } from '@/lib/currency'
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
const policyFor = (nonce: string) => [
  "default-src 'none'",
  "img-src https: data: blob:",
  "media-src https: blob:",
  "font-src https: data:",
  "style-src 'unsafe-inline' https:",
  // Ours and nothing else: a Space is built out of blocks, so no script in a
  // page is ever the owner's, and one that turned up anyway cannot run.
  `script-src 'nonce-${nonce}'`,
  "form-action 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
  "connect-src 'none'",
].join('; ')

const escapeForAttribute = (value: string) => value.replace(/"/g, '&quot;')

/*
 * The one narrow way a Space may speak to Kobbleston.
 *
 * It cannot call the API: it has no session, no cookies and no network. All
 * it can do is say that somebody pressed a donate button or an ad, and this
 * page decides what that means. Everything else it might post is ignored.
 */
const BRIDGE = `
(function () {
  /* Donating and ad presses are Kobbleston's business, so they are only ever
     reported outwards: this page cannot move anybody's Kubes by itself. */
  document.addEventListener('click', function (event) {
    var donate = event.target.closest('[data-kob-donate]')
    if (donate) {
      event.preventDefault()
      parent.postMessage({ kob: 'donate', amount: Number(donate.getAttribute('data-kob-donate')) }, '*')
      return
    }
    var ad = event.target.closest('[data-kob-ad-id]')
    if (ad) {
      event.preventDefault()
      parent.postMessage({ kob: 'ad-click', id: ad.getAttribute('data-kob-ad-id') }, '*')
    }
  })

  function clock(seconds) {
    if (!isFinite(seconds)) return '0:00'
    var whole = Math.floor(seconds)
    var rest = whole % 60
    return Math.floor(whole / 60) + ':' + (rest < 10 ? '0' : '') + rest
  }

  /* The player, driven the same way Create drives its own: press to play,
     drag or arrow along the bar, press to go quiet. */
  function player(box) {
    var media = box.querySelector('[data-kob-media]')
    var bar = box.querySelector('[data-kob-seek]')
    var fill = box.querySelector('[data-kob-fill]')
    var knob = box.querySelector('[data-kob-knob]')
    var at = box.querySelector('[data-kob-at]')
    var length = box.querySelector('[data-kob-length]')
    if (!media) return

    function draw() {
      var whole = media.duration || 0
      var part = whole ? (media.currentTime / whole) * 100 : 0
      if (fill) fill.style.width = part + '%'
      if (knob) knob.style.left = part + '%'
      if (at) at.textContent = clock(media.currentTime)
      if (length) length.textContent = clock(whole)
      if (bar) bar.setAttribute('aria-valuenow', String(Math.round(part)))
    }

    box.querySelector('[data-kob-play]').addEventListener('click', function () {
      if (media.paused) media.play(); else media.pause()
    })

    var mute = box.querySelector('[data-kob-mute]')
    if (mute) mute.addEventListener('click', function () {
      media.muted = !media.muted
      box.toggleAttribute('data-quiet', media.muted)
    })

    media.addEventListener('play', function () { box.setAttribute('data-playing', '') })
    media.addEventListener('pause', function () { box.removeAttribute('data-playing') })
    media.addEventListener('ended', function () { box.removeAttribute('data-playing') })
    media.addEventListener('timeupdate', draw)
    media.addEventListener('loadedmetadata', draw)
    media.addEventListener('durationchange', draw)

    if (bar) {
      var holding = false
      function seek(clientX) {
        var box2 = bar.getBoundingClientRect()
        if (!box2.width || !media.duration) return
        var part = Math.min(Math.max((clientX - box2.left) / box2.width, 0), 1)
        media.currentTime = part * media.duration
        draw()
      }
      bar.addEventListener('pointerdown', function (e) { holding = true; seek(e.clientX) })
      window.addEventListener('pointermove', function (e) { if (holding) seek(e.clientX) })
      window.addEventListener('pointerup', function () { holding = false })
      bar.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { media.currentTime = Math.min(media.currentTime + 5, media.duration || 0); draw() }
        if (e.key === 'ArrowLeft') { media.currentTime = Math.max(media.currentTime - 5, 0); draw() }
      })
    }

    draw()
  }

  /* A sound that simply runs. Nothing plays before somebody has touched the
     page, because a browser will not allow it and because being shouted at by
     a web page is rude. */
  function ambient(box) {
    var media = box.querySelector('[data-kob-media]')
    var button = box.querySelector('[data-kob-play]')
    if (!media || !button) return
    var refused = false

    button.addEventListener('click', function () {
      if (media.paused) { refused = false; media.play() } else { refused = true; media.pause() }
    })
    media.addEventListener('play', function () { box.setAttribute('data-playing', '') })
    media.addEventListener('pause', function () { box.removeAttribute('data-playing') })

    var begin = function () {
      if (!refused && media.paused) media.play().catch(function () {})
      window.removeEventListener('pointerdown', begin)
      window.removeEventListener('keydown', begin)
    }
    window.addEventListener('pointerdown', begin)
    window.addEventListener('keydown', begin)
  }

  document.querySelectorAll('[data-kob-player]').forEach(player)
  document.querySelectorAll('[data-kob-ambient]').forEach(ambient)
})()
`

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
 * The files are not served over HTTP, so the stylesheet the page asks for by
 * name is put into the document itself: `style.css` next to `index.html`
 * behaves the way it would if it had been fetched.
 */
function buildDocument(
  files: SpaceFile[],
  links: Map<string, string>,
  ads: Map<string, { ad: ShownAd; url: string } | null>,
  nonce: string,
) {
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
  // Content is referenced by its number, never copied, so this is where a
  // number becomes something the browser can actually load.
  for (const [reference, url] of links) {
    html = html.split(reference).join(escapeForAttribute(url))
  }

  /*
   * An ad slot is filled here rather than by the Space: picking which ad to
   * show, counting the view and paying for it are the platform's business,
   * and a page cannot be trusted to do any of that about itself.
   */
  html = html.replace(
    /<div class="kob-ad" data-kob-ad="([a-z]+)"><\/div>/g,
    (whole, size: string) => {
      const filled = ads.get(size)
      if (filled === undefined) return whole
      if (!filled) {
        return `<div class="kob-ad kob-ad-empty"><span>This space is for an ad</span></div>`
      }
      return `<div class="kob-ad" data-kob-ad-id="${escapeForAttribute(filled.ad.id)}" role="link" tabindex="0">`
        + `<img src="${escapeForAttribute(filled.url)}" alt="${escapeForAttribute(filled.ad.name)}" />`
        + `</div>`
    },
  )

  // Anything still pointing at a number never resolved: better an empty
  // picture than a broken address that says kob:// in the page.
  html = html.replace(/kob:\/\/[A-Za-z]{3}-\d+/g, '')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${escapeForAttribute(policyFor(nonce))}" />
<style>
html,body{margin:0;min-height:100%;background:#fff;color:#111;font-family:system-ui,sans-serif}
.kob-ad-empty{display:grid;place-items:center;height:100%;border:1px dashed currentColor;border-radius:8px;opacity:.4;font-size:12px}
[data-kob-ad-id]{cursor:pointer}
</style>
</head>
<body>
${html}
<script nonce="${nonce}">${BRIDGE}</script>
</body>
</html>`
}

/**
 * A Space, shown the way a visitor sees it: its own files, in a frame that
 * can do nothing but draw them.
 */
export function SiteFrame({
  files, title, className, spaceId, building,
}: {
  files: SpaceFile[]
  title: string
  className?: string
  /** Which Space this is, for the ad slots and the donate button. */
  spaceId?: string
  /** While building, ads are not counted and nothing can be given away. */
  building?: boolean
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const { profile } = useAuth()
  const frame = useRef<HTMLIFrameElement>(null)

  const [links, setLinks] = useState<Map<string, string>>(new Map())
  const [ads, setAds] = useState<Map<string, { ad: ShownAd; url: string } | null>>(new Map())
  const [giving, setGiving] = useState<number | null>(null)
  const [sending, setSending] = useState(false)

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

  /*
   * Which ad sizes this page asks for, so each slot is filled once. Asking
   * for one is what counts a view, so it does not happen while building.
   */
  const slots = useMemo(() => {
    const index = files.find((file) => file.path === 'index.html')?.content ?? ''
    return [...new Set([...index.matchAll(/data-kob-ad="([a-z]+)"/g)].map((m) => m[1]))]
  }, [files])

  useEffect(() => {
    let live = true
    if (building || !spaceId || !slots.length) { setAds(new Map()); return }

    Promise.all(slots.map(async (size) => {
      const ad = await pickAd(size as AdSize, spaceId).catch(() => null)
      if (!ad) return [size, null] as const
      const url = await assetUrl(ad.file_path, 3600).catch(() => null)
      return [size, url ? { ad, url } : null] as const
    })).then((pairs) => {
      if (live) setAds(new Map(pairs))
    })

    return () => { live = false }
  }, [slots, spaceId, building])

  // The only messages that mean anything, and only from this frame.
  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return
      const body = event.data as { kob?: string; amount?: number; id?: string }
      if (!body || typeof body.kob !== 'string') return

      if (body.kob === 'donate') {
        if (building) { toast('This is how it will work once it is live.', 'info'); return }
        if (!profile) { toast(`Make an account to give ${currency.plural}.`, 'info'); return }
        setGiving(Math.min(Math.max(Math.round(Number(body.amount) || 0), 1), 10000))
        return
      }

      if (body.kob === 'ad-click' && typeof body.id === 'string') {
        if (building) return
        const shown = [...ads.values()].find((filled) => filled?.ad.id === body.id)
        if (!shown) return
        await recordAdClick(shown.ad.id).catch(() => {})
        navigate(shown.ad.target_path)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [ads, building, navigate, profile, toast])

  const give = async () => {
    if (!spaceId || giving === null) return
    setSending(true)
    try {
      const left = await donateToSpace(spaceId, giving)
      toast(`Given. You have ${currency.amount(left)} left.`, 'success')
      setGiving(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not go through.', 'error')
    } finally {
      setSending(false)
    }
  }

  // A fresh one each time the page is built, so it cannot be guessed and
  // written into anything stored.
  const nonce = useMemo(
    () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
    [files],
  )

  const document = useMemo(
    () => buildDocument(files, links, ads, nonce),
    [files, links, ads, nonce],
  )

  return (
    <>
    <iframe
      ref={frame}
      title={title}
      srcDoc={document}
      // Scripts, and nothing else: no same origin, no forms, no popups, no
      // navigating the page that holds it.
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      className={cn('h-full w-full border-0 bg-white', className)}
    />

    {/* Nothing leaves an account without being asked here, on our side of
        the wall, where the amount can be read plainly. */}
    <Dialog
      open={giving !== null}
      onClose={() => setGiving(null)}
      title={`Give ${currency.plural}`}
      description="A gift to whoever made this Space. Nothing is promised in return."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => setGiving(null)}>Cancel</Button>
          <Button loading={sending} onClick={give}>
            <Kube />
            Give {giving}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">
        This sends <span className="font-bold text-white">{giving}</span> {currency.plural} from your account
        to the owner of this Space. It cannot be taken back.
      </p>
    </Dialog>
    </>
  )
}
