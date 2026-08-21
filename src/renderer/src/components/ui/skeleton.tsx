import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }): ReactNode {
  return <div className={cn("skeleton rounded-lg", className)} />
}

export default Skeleton
