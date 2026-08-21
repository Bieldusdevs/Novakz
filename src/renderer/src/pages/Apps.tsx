import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-toastify"
import {
  Boxes,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Terminal,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import { Page, EmptyState } from "@/components/ui/page"
import { Card } from "@/components/ui/card"
import Button from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/ui/input"
import { invoke, openExternal } from "@/lib/ipc"
import { cn, titleCase } from "@/lib/utils"
import useAppInstallStore from "@/store/appInstallStore"
import catalog from "@/assets/apps.json"
import type { CatalogApp } from "../../../types"

type Source = "Winget" | "Chocolatey"

const APPS = (catalog as { apps: CatalogApp[] }).apps.map((app) => ({
  ...app,
  // A handful of catalog entries are Chocolatey-only and have no winget id.
  key: app.id ?? app.chocolatey?.split(" ")[0] ?? app.name,
}))

type Listed = (typeof APPS)[number]

const packageId = (app: Listed, source: Source): string | undefined =>
  (source === "Chocolatey" ? (app.chocolatey ?? app.id) : app.id)?.split(" ")[0]

export default function Apps(): React.ReactNode {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [source, setSource] = useState<Source>("Winget")
  const [selected, setSelected] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(true)
  const { apps: statuses, output, busy, setBusy, clearApps } = useAppInstallStore()
  const consoleRef = useRef<HTMLPreElement>(null)

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(APPS.map((a) => a.category))).sort()],
    [],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return APPS.filter((a) => category === "all" || a.category === category).filter(
      (a) => !q || a.name.toLowerCase().includes(q) || (a.info ?? "").toLowerCase().includes(q),
    )
  }, [query, category])

  const logLines = useMemo(
    () =>
      Object.entries(output).flatMap(([appId, lines]) =>
        lines.map((line) => `[${appId}] ${line}`),
      ),
    [output],
  )

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight })
  }, [logLines])

  const toggle = (key: string): void =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]))

  const install = async (): Promise<void> => {
    if (!selected.length) return
    if (source === "Chocolatey") {
      const choco = await invoke<{ installed: boolean }>("check-chocolatey")
      if (!choco?.installed) {
        toast.info("Installing Chocolatey first…")
        await invoke("install-chocolatey")
      }
    } else {
      const winget = await invoke<{ installed: boolean }>("check-winget")
      if (!winget?.installed) {
        toast.info("Winget is missing — launching the installer.")
        await invoke("install-winget")
      }
    }

    clearApps()
    setBusy(true)
    const ids = selected
      .map((key) => packageId(APPS.find((a) => a.key === key)!, source))
      .filter((id): id is string => Boolean(id))

    await invoke("handle-apps", { action: "install", apps: ids, source }).catch(() => {
      setBusy(false)
      toast.error("Installation failed to start.")
    })
  }

  const statusFor = (app: Listed): string | undefined =>
    statuses[packageId(app, source) ?? ""]

  return (
    <Page
      title="Apps"
      description={`${APPS.length} curated packages · installs via ${source}`}
      icon={<Boxes className="size-5" />}
      actions={
        <>
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            {(["Winget", "Chocolatey"] as Source[]).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all",
                  source === s ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            loading={busy}
            disabled={!selected.length}
            icon={<Download className="size-4" />}
            onClick={install}
          >
            Install {selected.length ? `(${selected.length})` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps…"
            className="min-w-56"
          />
          <div className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
                  category === c
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-line text-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {titleCase(c)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={<Boxes className="size-5" />}
            title="No apps match your search"
            description="Try another keyword or pick a different category."
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((app) => {
            const active = selected.includes(app.key)
            const state = statusFor(app)
            const unavailable = !packageId(app, source)
            return (
              <Card
                key={app.key}
                hover
                onClick={() => !busy && !unavailable && toggle(app.key)}
                className={cn(
                  "cursor-pointer p-4",
                  active && "border-primary/35 bg-primary/[0.06]",
                  (busy || unavailable) && "cursor-not-allowed",
                  unavailable && "opacity-50",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface-2">
                    {app.icon ? (
                      <img
                        src={app.icon}
                        alt=""
                        loading="lazy"
                        className="size-6 object-contain"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      />
                    ) : (
                      <span className="text-xs font-bold text-subtle">{app.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-fg">{app.name}</p>
                      {state === "installing" && <Loader2 className="size-3.5 animate-spin text-primary" />}
                      {state === "done" && <CheckCircle2 className="size-3.5 text-success" />}
                      {state === "error" && <XCircle className="size-3.5 text-danger" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                      {app.info}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge>{titleCase(app.category)}</Badge>
                      {unavailable && <Badge tone="warning">Chocolatey only</Badge>}
                      {app.link && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openExternal(app.link!)
                          }}
                          className="inline-flex items-center gap-1 text-[10px] text-subtle transition hover:text-primary"
                        >
                          <ExternalLink className="size-3" /> Website
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {logLines.length > 0 && (
        <div className="sticky bottom-0 mt-4">
          <Card className="overflow-hidden bg-[var(--surface-solid)]">
            <button
              onClick={() => setShowConsole((s) => !s)}
              className="flex w-full items-center gap-2 border-b border-line px-4 py-2.5"
            >
              <Terminal className="size-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-subtle">
                Installer output
              </span>
              <ChevronDown
                className={cn(
                  "ml-auto size-4 text-subtle transition-transform",
                  !showConsole && "rotate-180",
                )}
              />
            </button>
            {showConsole && (
              <pre
                ref={consoleRef}
                className="scroll-area max-h-40 whitespace-pre-wrap px-4 py-3 font-mono text-[11px] leading-relaxed text-muted"
              >
                {logLines.join("\n")}
              </pre>
            )}
          </Card>
        </div>
      )}
    </Page>
  )
}
