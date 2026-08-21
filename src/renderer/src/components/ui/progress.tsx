import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Progress({
  value,
  className,
  indeterminate,
}: {
  value?: number
  className?: string
  indeterminate?: boolean
}): ReactNode {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-primary via-accent to-accent-2 transition-[width] duration-500",
          indeterminate && "w-1/3 animate-[shimmer_1.4s_ease-in-out_infinite]",
        )}
        style={indeterminate ? undefined : { width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
      />
    </div>
  )
}

export default Progress
