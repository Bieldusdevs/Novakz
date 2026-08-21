import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  footer?: ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  hideClose?: boolean
  children?: ReactNode
  className?: string
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  footer,
  size = "md",
  hideClose,
  children,
  className,
}: ModalProps): ReactNode {
  useEffect(() => {
    if (!open) return undefined
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !hideClose) onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose, hideClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !hideClose && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-2xl border border-line bg-[var(--surface-solid)]",
          "shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200",
          sizes[size],
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        {(title || !hideClose) && (
          <div className="flex items-start gap-3 border-b border-line px-6 py-5">
            {icon && (
              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-primary">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>}
              {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-surface-2 hover:text-fg"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        <div className="scroll-area max-h-[60vh] px-6 py-5 text-sm text-muted">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-surface px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
