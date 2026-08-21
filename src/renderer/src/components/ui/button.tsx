import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success"
type Size = "sm" | "md" | "lg" | "icon"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    "text-primary-fg bg-primary hover:brightness-110 shadow-[0_10px_30px_-12px_var(--primary)] border border-transparent",
  secondary:
    "bg-surface-2 text-fg border border-line hover:border-line-strong hover:bg-surface-2/80",
  ghost: "text-muted hover:text-fg hover:bg-surface-2 border border-transparent",
  outline: "border border-line-strong text-fg hover:bg-surface-2",
  danger:
    "text-white bg-danger/90 hover:bg-danger border border-transparent shadow-[0_10px_30px_-12px_var(--danger)]",
  success:
    "text-white bg-success/90 hover:bg-success border border-transparent shadow-[0_10px_30px_-12px_var(--success)]",
}

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-sm gap-2.5 rounded-xl",
  icon: "h-9 w-9 rounded-lg justify-center",
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading, icon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "no-drag inline-flex items-center font-medium whitespace-nowrap transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0",
        "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
})

export default Button
