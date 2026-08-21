import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, ...props },
  ref,
) {
  return (
    <div className="relative flex-1">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          "no-drag h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg",
          "placeholder:text-subtle transition-all duration-200",
          "focus:border-primary/50 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-primary/20",
          icon && "pl-9",
          className,
        )}
        {...props}
      />
    </div>
  )
})

export function SearchInput(props: InputProps): ReactNode {
  return <Input icon={<Search className="size-4" />} placeholder="Search…" {...props} />
}

export default Input
