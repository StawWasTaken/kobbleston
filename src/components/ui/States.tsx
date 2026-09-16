import type { ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import { Kobby } from '@/components/brand/Kobby'
import type { KobbyMood } from '@/components/brand/Kobby'
import { Button } from './Button'
import { cn } from '@/lib/cn'

export function EmptyState({
  mood = 'emptyBox',
  title,
  body,
  action,
  className,
}: {
  mood?: KobbyMood
  title: string
  body?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <Kobby mood={mood} size="md" />
      <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-500/15 text-red-300">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-lg" />
      </span>
      <h3 className="mt-4 text-base font-bold">That didn&apos;t load</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="subtle" size="sm" icon={faRotateRight} className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/[0.06]', className)} />
}

export function SpaceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-line bg-ink-card">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}
