import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'

const CELL = 14
const BRAND = [27, 52, 232]

/**
 * The pixel wash behind the homepage welcome. It is a coarse grid of brand
 * blue cells lit by two slow diagonal waves, so it reads as something built
 * out of pixels rather than a particle cloud. It draws on a downscaled
 * canvas at ~20fps and pauses whenever it is off screen.
 */
export function PixelField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let columns = 0
    let rows = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      columns = Math.ceil(width / CELL)
      rows = Math.ceil(height / CELL)
      canvas.width = width
      canvas.height = height
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      const t = time / 1000

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const wave =
            Math.sin((x * 0.32) + (y * 0.18) - t * 1.1) * 0.5 +
            Math.sin((x * 0.11) - (y * 0.26) + t * 0.7) * 0.5
          // fade out towards the bottom so headline text stays readable
          const falloff = 1 - y / rows
          const level = (wave * 0.5 + 0.5) * falloff

          if (level < 0.32) continue
          const alpha = (level - 0.32) * 0.85
          ctx.fillStyle = `rgba(${BRAND[0]}, ${BRAND[1]}, ${BRAND[2]}, ${alpha.toFixed(3)})`
          // the occasional brighter cell keeps the grid from looking uniform
          if (level > 0.88) ctx.fillStyle = `rgba(90, 116, 255, ${(alpha * 0.9).toFixed(3)})`
          ctx.fillRect(x * CELL, y * CELL, CELL - 2, CELL - 2)
        }
      }
    }

    resize()

    if (reduced) {
      draw(0)
      return
    }

    let frame = 0
    let last = 0
    let running = true

    const loop = (time: number) => {
      if (time - last > 50) {
        draw(time)
        last = time
      }
      if (running) frame = requestAnimationFrame(loop)
    }

    const observer = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting
      if (running) frame = requestAnimationFrame(loop)
      else cancelAnimationFrame(frame)
    })
    observer.observe(canvas)

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [reduced])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  )
}
