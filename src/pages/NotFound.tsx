import { Button } from '@/components/ui/Button'
import { Kobby } from '@/components/brand/Kobby'
import { PixelField } from '@/components/brand/PixelField'

export default function NotFound() {
  return (
    <div className="relative grid min-h-[70dvh] place-items-center overflow-hidden px-4 py-16">
      <PixelField className="opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 to-ink" />

      <div className="relative flex flex-col items-center text-center">
        <Kobby mood="noResults" size="lg" />
        <p className="mt-6 font-display text-6xl font-extrabold text-[#7f92ff]">404</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Nothing at this address</h1>
        <p className="mt-2 max-w-sm text-white/65">
          Kobby had a look around. Either it moved, or it was never here.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button to="/home">Go home</Button>
          <Button variant="subtle" to="/discover">Discover Spaces</Button>
        </div>
      </div>
    </div>
  )
}
