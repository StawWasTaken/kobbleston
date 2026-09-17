import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlay, faPause, faVolumeHigh, faVolumeXmark, faRotateRight,
} from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/cn'

const clock = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** The bar you drag. Keyboard driven as well, because it is a real control. */
function Scrubber({
  value, max, buffered, onSeek, label,
}: {
  value: number
  max: number
  buffered: number
  onSeek: (next: number) => void
  label: string
}) {
  const track = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const seekTo = (clientX: number) => {
    const box = track.current?.getBoundingClientRect()
    if (!box || !max) return
    onSeek(Math.min(Math.max((clientX - box.left) / box.width, 0), 1) * max)
  }

  useEffect(() => {
    if (!dragging) return
    const move = (e: PointerEvent) => seekTo(e.clientX)
    const up = () => setDragging(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [dragging, max])

  const pct = max ? (value / max) * 100 : 0
  const loaded = max ? (buffered / max) * 100 : 0

  return (
    <div
      ref={track}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      aria-valuetext={clock(value)}
      onPointerDown={(e) => { setDragging(true); seekTo(e.clientX) }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); onSeek(Math.min(value + 5, max)) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); onSeek(Math.max(value - 5, 0)) }
        if (e.key === 'Home') { e.preventDefault(); onSeek(0) }
        if (e.key === 'End') { e.preventDefault(); onSeek(max) }
      }}
      className="group/bar relative h-6 flex-1 cursor-pointer touch-none select-none"
    >
      <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/15" />
      <span
        className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/25"
        style={{ width: `${loaded}%` }}
      />
      <span
        className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-bright"
        style={{ width: `${pct}%` }}
      />
      <span
        className={cn(
          'absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform',
          dragging ? 'scale-125' : 'scale-0 group-hover/bar:scale-100',
        )}
        style={{ left: `${pct}%` }}
      />
    </div>
  )
}

function VolumeControl({ media }: { media: HTMLMediaElement | null }) {
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    if (!media) return
    media.volume = volume
    media.muted = muted
  }, [media, volume, muted])

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMuted((v) => !v)}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="grid h-8 w-8 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <FontAwesomeIcon icon={muted || volume === 0 ? faVolumeXmark : faVolumeHigh} />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false) }}
        aria-label="Volume"
        className="hidden h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#3A50FF] sm:block"
      />
    </div>
  )
}

/**
 * Our own player for sound and video. It never offers the file: there is no
 * download control, no context menu on the picture, and the source it plays
 * from is a link that expires.
 */
export function MediaPlayer({
  src, kind, poster, className,
}: {
  src: string | null
  kind: 'audio' | 'video'
  poster?: string | null
  className?: string
}) {
  const media = useRef<HTMLVideoElement & HTMLAudioElement>(null)
  const [node, setNode] = useState<HTMLMediaElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [length, setLength] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [ended, setEnded] = useState(false)

  useEffect(() => { setNode(media.current) }, [src])

  const toggle = () => {
    const element = media.current
    if (!element) return
    if (element.paused) { void element.play(); setEnded(false) } else element.pause()
  }

  const shared = {
    ref: media,
    src: src ?? undefined,
    preload: 'metadata' as const,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => { setPlaying(false); setEnded(true) },
    onTimeUpdate: () => setTime(media.current?.currentTime ?? 0),
    onLoadedMetadata: () => setLength(media.current?.duration ?? 0),
    onProgress: () => {
      const element = media.current
      if (element?.buffered.length) setBuffered(element.buffered.end(element.buffered.length - 1))
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }

  const controls = (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <button
        onClick={toggle}
        disabled={!src}
        aria-label={playing ? 'Pause' : 'Play'}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-[#fff] transition-colors hover:bg-brand-bright disabled:opacity-40"
      >
        <FontAwesomeIcon
          icon={ended ? faRotateRight : playing ? faPause : faPlay}
          className={cn(!playing && !ended && 'translate-x-px')}
        />
      </button>

      <span className="w-10 shrink-0 text-xs tabular-nums text-white/70">{clock(time)}</span>

      <Scrubber
        value={time}
        max={length}
        buffered={buffered}
        label="Seek"
        onSeek={(next) => {
          if (media.current) media.current.currentTime = next
          setTime(next)
        }}
      />

      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-white/70">
        {clock(length)}
      </span>

      <VolumeControl media={node} />
    </div>
  )

  if (kind === 'audio') {
    return (
      <div className={cn('rounded-xl border border-ink-line bg-ink-raised', className)}>
        <audio {...shared} className="hidden" />
        {controls}
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-ink-line bg-black', className)}>
      <div className="relative">
        <video
          {...shared}
          poster={poster ?? undefined}
          playsInline
          disablePictureInPicture
          onClick={toggle}
          className="aspect-video w-full cursor-pointer select-none bg-black"
        />
        {!playing && (
          <button
            onClick={toggle}
            aria-label="Play"
            className="absolute inset-0 grid place-items-center bg-black/30 transition-colors hover:bg-black/20"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-[#fff] shadow-pop">
              <FontAwesomeIcon icon={ended ? faRotateRight : faPlay} className="text-xl" />
            </span>
          </button>
        )}
      </div>
      <div className="bg-ink-raised">{controls}</div>
    </div>
  )
}
