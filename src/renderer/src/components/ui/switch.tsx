import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}

export function Switch({ checked, onChange, disabled, label, className }: SwitchProps): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "no-drag relative h-6 w-11 shrink-0 rounded-full border transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        checked
          ? "border-transparent bg-primary shadow-[0_0_18px_-4px_var(--primary)]"
          : "border-line bg-surface-2",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-4.5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-300",
          checked ? "left-[calc(100%-1.3125rem)]" : "left-[3px] bg-muted",
        )}
      />
    </button>
  )
}

export default Switch
