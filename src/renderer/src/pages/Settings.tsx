import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import {
  Settings as SettingsIcon,
  Palette,
  Bell,
  Bug,
  FolderOpen,
  Eraser,
  RefreshCw,
  GitBranch,
  Globe,
  Power,
  Check,
} from "lucide-react"
import { Page } from "@/components/ui/page"
import { Card } from "@/components/ui/card"
import Button from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { invoke, openExternal, isElectron } from "@/lib/ipc"
import useSettingsStore, { type ThemeName } from "@/store/settings"
import { cn } from "@/lib/utils"
import { CURRENT_VERSION, GITHUB_REPO, WEBSITE } from "@/lib/version"

const THEMES: { id: ThemeName; label: string; swatch: string[] }[] = [
  { id: "system", label: "System", swatch: ["#0b0f18", "#f4f6fb", "#4d8dff"] },
  { id: "dark", label: "Midnight", swatch: ["#07090f", "#101623", "#4d8dff"] },
  { id: "light", label: "Daylight", swatch: ["#f4f6fb", "#ffffff", "#2563eb"] },
  { id: "purple", label: "Nebula", swatch: ["#0b0716", "#180f2b", "#a855f7"] },
  { id: "gray", label: "Graphite", swatch: ["#0d0d0f", "#17171b", "#e4e4e7"] },
  { id: "classic", label: "Classic", swatch: ["#030711", "#071426", "#01e5ff"] },
]

function Row({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}): React.ReactNode {
  return (
    <div className="flex items-center gap-3 border-b border-line px-5 py-4 last:border-b-0">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function Settings(): React.ReactNode {
  const { theme, setTheme } = useSettingsStore()
  const [tray, setTray] = useState(false)
  const [rpc, setRpc] = useState(true)
  const [analyticsOff, setAnalyticsOff] = useState(
    localStorage.getItem("posthogDisabled") === "true",
  )
  const [version, setVersion] = useState(CURRENT_VERSION)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    invoke<boolean>("tray:get").then((v) => setTray(Boolean(v))).catch(() => undefined)
    invoke<boolean>("rpc-enabled:get").then((v) => setRpc(v !== false)).catch(() => undefined)
    invoke<string>("updater:get-version").then((v) => v && setVersion(v)).catch(() => undefined)
  }, [])

  return (
    <Page
      title="Settings"
      description="Personalize Sparkle and manage maintenance actions."
      icon={<SettingsIcon className="size-5" />}
      actions={
        <Badge tone="primary" className="h-8 px-3 text-[11px] normal-case tracking-normal">
          Sparkle v{version}
        </Badge>
      }
    >
      <div className="space-y-4 pb-4">
        {/* Appearance */}
        <Card>
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <Palette className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-fg">Appearance</h3>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {THEMES.map((option) => (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                  theme === option.id
                    ? "border-primary/50 bg-primary/[0.08]"
                    : "border-line hover:border-line-strong hover:bg-surface-2",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {option.swatch.map((color) => (
                      <span
                        key={color}
                        className="size-4 rounded-full border border-black/20"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-fg">{option.label}</span>
                  {theme === option.id && <Check className="ml-auto size-3.5 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Behaviour */}
        <Card>
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <Bell className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-fg">Behaviour</h3>
          </div>
          <Row
            icon={<Power className="size-4" />}
            title="Keep in system tray"
            description="Closing the window minimizes Sparkle to the notification area."
          >
            <Switch
              checked={tray}
              onChange={async (value) => {
                setTray(value)
                await invoke("tray:set", value)
              }}
            />
          </Row>
          <Row
            icon={<Globe className="size-4" />}
            title="Discord Rich Presence"
            description="Show what you're optimizing on your Discord profile."
          >
            <Switch
              checked={rpc}
              onChange={async (value) => {
                setRpc(value)
                await invoke("rpc-enabled:set", value)
              }}
            />
          </Row>
          <Row
            icon={<Bug className="size-4" />}
            title="Disable anonymous analytics"
            description="Opt out of anonymous usage statistics."
          >
            <Switch
              checked={analyticsOff}
              onChange={(value) => {
                setAnalyticsOff(value)
                localStorage.setItem("posthogDisabled", String(value))
                document.body.classList.toggle("ph-no-capture", value)
              }}
            />
          </Row>
        </Card>

        {/* Maintenance */}
        <Card>
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <Eraser className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-fg">Maintenance</h3>
          </div>
          <Row
            icon={<Eraser className="size-4" />}
            title="Clear Sparkle cache"
            description="Removes generated scripts and cached hardware info."
          >
            <Button
              size="sm"
              onClick={async () => {
                await invoke("clear-sparkle-cache")
                toast.success("Cache cleared.")
              }}
            >
              Clear
            </Button>
          </Row>
          <Row
            icon={<FolderOpen className="size-4" />}
            title="Open log folder"
            description="Useful when reporting a bug on GitHub."
          >
            <Button size="sm" onClick={() => invoke("open-log-folder")}>
              Open
            </Button>
          </Row>
          <Row
            icon={<RefreshCw className="size-4" />}
            title="Check for updates"
            description={`You are running version ${version}.`}
          >
            <Button
              size="sm"
              loading={checking}
              onClick={async () => {
                setChecking(true)
                await invoke("updater:check").catch(() => undefined)
                setTimeout(() => {
                  setChecking(false)
                  toast.info("Update check finished.")
                }, 1200)
              }}
            >
              Check
            </Button>
          </Row>
          {isElectron && (
            <Row
              icon={<Bug className="size-4" />}
              title="Developer tools"
              description="Open Chromium DevTools for the renderer."
            >
              <Button size="sm" onClick={() => invoke("open-devtools")}>
                Open
              </Button>
            </Row>
          )}
        </Card>

        {/* About */}
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary via-accent to-accent-2 text-lg font-black text-white">
                S
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">Sparkle {version}</p>
                <p className="text-[11px] text-muted">Windows optimization, reimagined.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                icon={<GitBranch className="size-4" />}
                onClick={() => openExternal(`https://github.com/${GITHUB_REPO}`)}
              >
                GitHub
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={<Globe className="size-4" />}
                onClick={() => openExternal(WEBSITE)}
              >
                Website
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  )
}
