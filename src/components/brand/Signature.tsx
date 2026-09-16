import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'

/**
 * Staw's signature: white artwork, wiped in from the left as if it were
 * being written. If the file is missing nothing renders, rather than a
 * made-up signature standing in for a real one.
 */
export function Signature({ className }: { className?: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [drawn, setDrawn] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const img = new Image()
    img.src = '/brand/staw-signature.png'
    img.onload = () => setState('ready')
    img.onerror = () => setState('missing')
  }, [])

  useEffect(() => {
    if (state !== 'ready' || !ref.current) return
    if (reduced) {
      setDrawn(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [state, reduced])

  if (state !== 'ready') return null

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <img
        src="/brand/staw-signature.png"
        alt="Staw"
        className="h-20 w-auto select-none transition-[clip-path] duration-[1600ms] ease-out"
        style={{ clipPath: drawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)' }}
      />
    </div>
  )
}
