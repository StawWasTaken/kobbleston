import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * The bar of controls that belongs to a list: tabs, a search, filters.
 *
 * It sticks under the top bar so the controls stay with you as the list runs
 * on, and it takes the page's own gutters back so the blur runs edge to edge
 * rather than leaving a gap at each side.
 */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky top-[3.25rem] z-20 -mx-4 space-y-2.5 border-b border-ink-line',
        'bg-ink/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
