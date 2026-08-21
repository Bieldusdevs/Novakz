import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
}

export function Card({ className, hover, glow, ...props }: CardProps): ReactNode {
  return (
    <div
      className={cn(
        "glass relative rounded-2xl transition-all duration-300",
        hover && "hover:border-line-strong hover:bg-surface-2 hover:-translate-y-0.5",
        glow && "shadow-[0_24px_60px_-32px_var(--primary)]",
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactNode {
  return <div className={cn("flex items-start justify-between gap-4 p-5 pb-0", className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>): ReactNode {
  return <h3 className={cn("text-sm font-semibold tracking-tight text-fg", className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>): ReactNode {
  return <p className={cn("text-xs leading-relaxed text-muted", className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactNode {
  return <div className={cn("p-5", className)} {...props} />
}

export default Card
