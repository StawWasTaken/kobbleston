/*
 * A small picture of a piece of content, made in the browser.
 *
 * The file itself is not something a browser can link to: the uploads bucket
 * is private on purpose, so a decal cannot be hotlinked and a video cannot be
 * taken by address. That also means nothing outside Kobblon can show what
 * a piece of content looks like, which is why a link pasted into a chat used
 * to be a name and no picture.
 *
 * So the browser draws one at upload: a decal shrunk down, a frame out of a
 * video. It goes in a bucket that is public, because a card has to be
 * fetchable by something with no account, and it is only ever made for
 * content that is listed in Create, which shows the same picture to anybody
 * who opens its page. Nothing about this makes the original file public.
 */
import type { AssetKind } from '@/types/db'

/** Big enough for a card at full width, small enough to be nothing much. */
const WIDEST = 1280
const QUALITY = 0.82

/** The kinds that look like something. A sound has nothing to draw. */
export const canPreview = (kind: AssetKind) => kind === 'image' || kind === 'video'

function fit(width: number, height: number) {
  const scale = Math.min(1, WIDEST / Math.max(width, height))
  return { w: Math.max(1, Math.round(width * scale)), h: Math.max(1, Math.round(height * scale)) }
}

function draw(source: CanvasImageSource, width: number, height: number): Promise<Blob | null> {
  const { w, h } = fit(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const brush = canvas.getContext('2d')
  if (!brush) return Promise.resolve(null)
  brush.drawImage(source, 0, 0, w, h)
  return new Promise((done) => canvas.toBlob(done, 'image/jpeg', QUALITY))
}

async function fromPicture(src: string) {
  const picture = new Image()
  picture.crossOrigin = 'anonymous'
  picture.src = src
  await picture.decode()
  return draw(picture, picture.naturalWidth, picture.naturalHeight)
}

/*
 * A frame from a quarter of the way in. The very first frame of a video is
 * very often black, a title card or a fade, and a still of nothing tells
 * somebody nothing about what they are being sent.
 */
function fromFilm(src: string) {
  return new Promise<Blob | null>((done) => {
    const film = document.createElement('video')
    film.crossOrigin = 'anonymous'
    film.preload = 'metadata'
    film.muted = true
    film.playsInline = true

    const giveUp = window.setTimeout(() => { film.src = ''; done(null) }, 15_000)
    const finish = (blob: Blob | null) => { window.clearTimeout(giveUp); film.src = ''; done(blob) }

    film.onloadedmetadata = () => {
      film.currentTime = Math.min(
        Number.isFinite(film.duration) ? film.duration * 0.25 : 1,
        3,
      )
    }
    film.onseeked = () => {
      void draw(film, film.videoWidth, film.videoHeight).then(finish)
    }
    film.onerror = () => finish(null)

    film.src = src
  })
}

/** From the file somebody is uploading, before it has gone anywhere. */
export async function previewOf(file: File, kind: AssetKind): Promise<Blob | null> {
  if (!canPreview(kind)) return null
  const src = URL.createObjectURL(file)
  try {
    return kind === 'video' ? await fromFilm(src) : await fromPicture(src)
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(src)
  }
}

/** From something already uploaded, for work that predates previews. */
export async function previewOfUrl(url: string, kind: AssetKind): Promise<Blob | null> {
  if (!canPreview(kind)) return null
  try {
    return kind === 'video' ? await fromFilm(url) : await fromPicture(url)
  } catch {
    return null
  }
}
