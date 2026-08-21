import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageProps {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** Shared page shell: sticky header + scrollable body. */
export function Page({ title, description, icon, actions, children, className }: PageProps): ReactNode {
  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-5">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="grid size-11 place-items-center rounded-2xl border border-line bg-surface-2 text-primary shadow-[0_10px_30px_-18px_var(--primary)]">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-fg">{title}</h1>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={cn("scroll-area -mr-2 flex-1 pr-2 pb-2 animate-fade-up", className)}>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}): ReactNode {
  return (
    <div className="glass flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-14 text-center">
      {icon && (
        <div className="grid size-12 place-items-center rounded-2xl border border-line bg-surface-2 text-subtle">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-fg">{title}</p>
        {description && <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export default Page
