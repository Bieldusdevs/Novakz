import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Sparkles,
  Trash2,
  PackageMinus,
  Boxes,
  Wrench,
  Globe,
  Archive,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  hint?: string
}

const primary: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tweaks", label: "Tweaks", icon: Sparkles },
  { to: "/debloat", label: "Debloat", icon: PackageMinus },
  { to: "/clean", label: "Clean", icon: Trash2 },
  { to: "/apps", label: "Apps", icon: Boxes },
]

const secondary: NavItem[] = [
  { to: "/dns", label: "DNS", icon: Globe },
  { to: "/utilities", label: "Utilities", icon: Wrench },
  { to: "/backup", label: "Backup", icon: Archive },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
]

function Item({ item, collapsed }: { item: NavItem; collapsed: boolean }): React.ReactNode {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-surface-2 text-fg shadow-[inset_0_1px_0_0_var(--line-strong)]"
            : "text-muted hover:bg-surface hover:text-fg",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-accent transition-all duration-300",
              isActive ? "opacity-100" : "opacity-0",
            )}
          />
          <Icon
            className={cn(
              "size-[18px] shrink-0 transition-colors",
              isActive ? "text-primary" : "text-subtle group-hover:text-fg",
            )}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function Nav({ collapsed }: { collapsed: boolean }): React.ReactNode {
  return (
    <aside
      className={cn(
        "fixed left-0 top-12 bottom-0 z-40 flex flex-col gap-6 border-r border-line bg-bg/60 px-3 py-5 backdrop-blur-xl transition-all duration-300 ease-out",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <nav className="flex flex-col gap-1">
        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Optimize
          </p>
        )}
        {primary.map((item) => (
          <Item key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <nav className="flex flex-col gap-1">
        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-subtle">
            System
          </p>
        )}
        {secondary.map((item) => (
          <Item key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="mt-auto">
        {!collapsed ? (
          <div className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-br from-primary/12 via-transparent to-accent-2/12 p-3">
            <p className="text-[11px] font-semibold text-fg">Keep Windows fast</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              Create a restore point before applying risky tweaks.
            </p>
          </div>
        ) : (
          <div className="mx-auto size-8 rounded-xl bg-gradient-to-br from-primary/25 to-accent-2/25" />
        )}
      </div>
    </aside>
  )
}
