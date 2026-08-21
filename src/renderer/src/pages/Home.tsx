import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import {
  Cpu,
  MemoryStick,
  MonitorSmartphone,
  HardDrive,
  Sparkles,
  Trash2,
  Archive,
  Globe,
  Zap,
  Activity,
  ChevronRight,
  Gpu,
} from "lucide-react"
import { Page } from "@/components/ui/page"
import { Card } from "@/components/ui/card"
import Button from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { invoke, on } from "@/lib/ipc"
import { formatBytes } from "@/lib/utils"
import type { SystemInfo } from "../../../types"

interface SpecProps {
  icon: React.ReactNode
  label: string
  value?: string
  hint?: string
  loading?: boolean
}

function Spec({ icon, label, value, hint, loading }: SpecProps): React.ReactNode {
  return (
    <Card hover className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-4 w-36" />
          ) : (
            <p className="mt-1 truncate text-sm font-semibold text-fg" title={value}>
              {value || "Unknown"}
            </p>
          )}
          {hint && !loading && <p className="mt-0.5 truncate text-[11px] text-muted">{hint}</p>}
        </div>
      </div>
    </Card>
  )
}

export default function Home(): React.ReactNode {
  const navigate = useNavigate()
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [extra, setExtra] = useState<Partial<SystemInfo>>({})
  const [userName, setUserName] = useState("")
  const [activeTweaks, setActiveTweaks] = useState<string[]>([])
  const [totalTweaks, setTotalTweaks] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    invoke<SystemInfo>("get-system-info").then(setInfo).catch(() => undefined)
    invoke<string>("get-user-name").then(setUserName).catch(() => undefined)
    invoke<string[]>("tweak:active").then((t) => setActiveTweaks(t ?? [])).catch(() => undefined)
    invoke<unknown[]>("tweaks:fetch")
      .then((t) => setTotalTweaks(t?.length ?? 0))
      .catch(() => undefined)

    return on("system-info-extra", (_e, payload: Partial<SystemInfo>) =>
      setExtra((prev) => ({ ...prev, ...payload })),
    )
  }, [])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  }, [])

  const score = useMemo(() => {
    if (!totalTweaks) return 0
    return Math.min(100, Math.round((activeTweaks.length / Math.max(totalTweaks, 1)) * 100) + 12)
  }, [activeTweaks, totalTweaks])

  const runAction = async (key: string, fn: () => Promise<unknown>, message: string): Promise<void> => {
    setBusy(key)
    try {
      await fn()
      toast.success(message)
    } catch {
      toast.error("Something went wrong. Check the logs for details.")
    } finally {
      setBusy(null)
    }
  }

  const quickActions = [
    {
      key: "tweaks",
      icon: <Sparkles className="size-4" />,
      title: "Apply tweaks",
      subtitle: `${totalTweaks} available`,
      onClick: () => navigate("/tweaks"),
    },
    {
      key: "clean",
      icon: <Trash2 className="size-4" />,
      title: "Clean system",
      subtitle: "Free up disk space",
      onClick: () => navigate("/clean"),
    },
    {
      key: "restore",
      icon: <Archive className="size-4" />,
      title: "Restore point",
      subtitle: "Snapshot before changes",
      onClick: () =>
        runAction(
          "restore",
          () => invoke("create-sparkle-restore-point"),
          "Restore point created successfully.",
        ),
    },
    {
      key: "dns",
      icon: <Globe className="size-4" />,
      title: "Flush DNS",
      subtitle: "Clear resolver cache",
      onClick: () => runAction("dns", () => invoke("dns:flush-cache"), "DNS cache flushed."),
    },
  ]

  const loading = !info

  return (
    <Page
      title={`${greeting}${userName ? `, ${userName}` : ""}`}
      description="Here's the current state of your machine."
      icon={<Activity className="size-5" />}
      actions={
        <Button
          variant="primary"
          icon={<Zap className="size-4" />}
          onClick={() => navigate("/tweaks")}
        >
          Optimize now
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Hero */}
        <Card glow className="overflow-hidden">
          <div className="relative flex flex-wrap items-center justify-between gap-6 p-6">
            <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-primary/20 blur-3xl animate-float" />
            <div className="relative">
              <Badge tone="primary">System overview</Badge>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-gradient">
                {info?.os ?? "Windows"} · {info?.os_version ?? "—"}
              </h2>
              <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted">
                {activeTweaks.length} tweak{activeTweaks.length === 1 ? "" : "s"} currently applied out
                of {totalTweaks}. Sparkle keeps track of everything it changes so you can revert at any
                time.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => navigate("/tweaks")}>
                  Manage tweaks
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate("/backup")}>
                  Backups
                </Button>
              </div>
            </div>

            <div className="relative grid size-32 shrink-0 place-items-center">
              <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 327} 327`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold text-fg">{score}</p>
                <p className="text-[10px] uppercase tracking-widest text-subtle">Tuned</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Specs */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Spec
            icon={<Cpu className="size-4" />}
            label="Processor"
            value={info?.cpu_model}
            hint={info ? `${info.cpu_cores} cores · ${info.cpu_threads} threads` : undefined}
            loading={loading}
          />
          <Spec
            icon={<MemoryStick className="size-4" />}
            label="Memory"
            value={info ? formatBytes(info.memory_total) : undefined}
            hint={info?.memory_type}
            loading={loading}
          />
          <Spec
            icon={<Gpu className="size-4" />}
            label="Graphics"
            value={extra.gpu_model}
            hint={extra.vram ? `${extra.vram} VRAM` : extra.integrated_gpu}
            loading={!extra.gpu_model}
          />
          <Spec
            icon={<HardDrive className="size-4" />}
            label="Storage"
            value={extra.disk_model}
            hint={extra.disk_size}
            loading={!extra.disk_model}
          />
          <Spec
            icon={<MonitorSmartphone className="size-4" />}
            label="Operating system"
            value={info?.os}
            hint={info ? `Version ${info.os_version}` : undefined}
            loading={loading}
          />
          <Spec
            icon={<Sparkles className="size-4" />}
            label="Active tweaks"
            value={`${activeTweaks.length} applied`}
            hint={totalTweaks ? `${totalTweaks} tweaks available` : undefined}
          />
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Quick actions
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <button key={action.key} onClick={action.onClick} className="text-left">
                <Card hover className="group h-full p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent-2/20 text-primary">
                      {action.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-fg">
                        {busy === action.key ? "Working…" : action.title}
                      </p>
                      <p className="truncate text-[11px] text-muted">{action.subtitle}</p>
                    </div>
                    <ChevronRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>

        {/* Applied tweaks */}
        {activeTweaks.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">Recently applied</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate("/tweaks")}>
                See all
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeTweaks.slice(0, 12).map((name) => (
                <Badge key={name} tone="success" className="normal-case tracking-normal">
                  {name.replace(/-/g, " ")}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Page>
  )
}
