import { useEffect, useState } from "react"
import { Minus, Square, X, PanelLeft, ShieldCheck, ShieldAlert, WifiOff, Copy } from "lucide-react"
import { send, isElectron } from "@/lib/ipc"
import useOnlineStore from "@/store/online"
import { cn } from "@/lib/utils"
import { APP_NAME, CURRENT_VERSION } from "@/lib/version"

interface TitleBarProps {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
  adminStatus: boolean | null
}

function ControlButton({
  onClick,
  className,
  label,
  children,
}: {
  onClick: () => void
  className?: string
  label: string
  children: React.ReactNode
}): React.ReactNode {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "no-drag grid h-full w-12 place-items-center text-muted transition-colors hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      {children}
    </button>
  )
}

export default function TitleBar({
  onToggleSidebar,
  sidebarCollapsed,
  adminStatus,
}: TitleBarProps): React.ReactNode {
  const { online } = useOnlineStore()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    const onResize = (): void => setMaximized(window.outerWidth >= screen.availWidth - 4)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <header className="drag-region fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="flex h-full items-center gap-2 pl-2">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="no-drag grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <PanelLeft
            className={cn("size-4 transition-transform duration-300", sidebarCollapsed && "rotate-180")}
          />
        </button>

        <div className="flex items-center gap-2 pl-1">
          <div className="grid size-6 place-items-center rounded-md bg-gradient-to-br from-primary via-accent to-accent-2 text-[11px] font-black text-white shadow-[0_6px_18px_-8px_var(--primary)]">
            S
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-fg">{APP_NAME}</span>
          <span className="rounded-md border border-line bg-surface-2 px-1.5 py-px font-mono text-[10px] text-subtle">
            v{CURRENT_VERSION}
          </span>
        </div>
      </div>

      <div className="flex h-full items-center gap-2">
        {!online && (
          <span className="flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-warning">
            <WifiOff className="size-3" /> Offline
          </span>
        )}
        {adminStatus !== null && (
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              adminStatus
                ? "border-success/25 bg-success/10 text-success"
                : "border-danger/25 bg-danger/10 text-danger",
            )}
          >
            {adminStatus ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
            {adminStatus ? "Admin" : "No admin"}
          </span>
        )}
        {!isElectron && (
          <span className="mr-1 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
            Preview mode
          </span>
        )}

        <div className="flex h-full">
          <ControlButton label="Minimize" onClick={() => send("window-minimize")}>
            <Minus className="size-4" />
          </ControlButton>
          <ControlButton
            label="Maximize"
            onClick={() => {
              send("window-toggle-maximize")
              setMaximized((m) => !m)
            }}
          >
            {maximized ? <Copy className="size-3.5 -scale-x-100" /> : <Square className="size-3" />}
          </ControlButton>
          <ControlButton
            label="Close"
            className="hover:bg-danger hover:text-white"
            onClick={() => send("window-close")}
          >
            <X className="size-4" />
          </ControlButton>
        </div>
      </div>
    </header>
  )
}
