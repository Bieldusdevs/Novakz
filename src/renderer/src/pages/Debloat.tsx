import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { PackageMinus, RefreshCw, Search, Store, Loader2, Trash2 } from "lucide-react"
import { Page, EmptyState } from "@/components/ui/page"
import { Card } from "@/components/ui/card"
import Button from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import Modal from "@/components/ui/modal"
import { invoke, on } from "@/lib/ipc"
import { cn } from "@/lib/utils"
import type { InstalledApp } from "../../../types"

type Filter = "all" | "store" | "desktop"

export default function Debloat(): React.ReactNode {
  const [apps, setApps] = useState<InstalledApp[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [selected, setSelected] = useState<string[]>([])
  const [confirm, setConfirm] = useState(false)
  const [working, setWorking] = useState<string | null>(null)

  const load = useCallback(async (reload = false) => {
    setLoading(true)
    try {
      if (reload) await invoke("reload-installed-apps")
      const list = await invoke<InstalledApp[]>("get-installed-apps")
      setApps(Array.isArray(list) ? list : [])
    } catch {
      toast.error("Could not read the installed programs list.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const offs = [
      on("uninstall-progress", (_e, name: string) => setWorking(name)),
      on("uninstall-complete", () => {
        setWorking(null)
        setSelected([])
        toast.success("Uninstall finished.")
        load(true)
      }),
    ]
    return () => offs.forEach((off) => off())
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps
      .filter((a) =>
        filter === "all" ? true : filter === "store" ? a.isStoreApp : !a.isStoreApp,
      )
      .filter((a) => !q || a.name.toLowerCase().includes(q) || a.publisher?.toLowerCase().includes(q))
  }, [apps, query, filter])

  const toggle = (id: string): void =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const uninstall = async (): Promise<void> => {
    setConfirm(false)
    const payload = apps.filter((a) => selected.includes(a.id))
    setWorking(payload[0]?.name ?? "")
    try {
      await invoke("uninstall-apps", payload)
    } catch {
      toast.error("Uninstall failed.")
      setWorking(null)
    }
  }

  return (
    <Page
      title="Debloat"
      description={`${apps.length} programs detected on this machine`}
      icon={<PackageMinus className="size-5" />}
      actions={
        <>
          <Button variant="ghost" icon={<RefreshCw className="size-4" />} onClick={() => load(true)}>
            Rescan
          </Button>
          <Button
            variant="danger"
            disabled={!selected.length || Boolean(working)}
            icon={<Trash2 className="size-4" />}
            onClick={() => setConfirm(true)}
          >
            Uninstall {selected.length ? `(${selected.length})` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs or publishers…"
            className="min-w-56"
          />
          <div className="flex items-center gap-1.5">
            {(["all", "desktop", "store"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium capitalize transition-all",
                  filter === f
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-line text-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {f === "desktop" ? "Desktop apps" : f === "store" ? "Store apps" : "All"}
              </button>
            ))}
          </div>
        </div>

        {working && (
          <Card className="flex items-center gap-3 p-4">
            <Loader2 className="size-4 animate-spin text-primary" />
            <p className="text-xs text-muted">
              Uninstalling <span className="font-semibold text-fg">{working}</span>… this can take a
              while.
            </p>
          </Card>
        )}

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<Search className="size-5" />}
            title="Nothing matches your filters"
            description="Try another keyword or switch the app type filter."
          />
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((app) => {
              const active = selected.includes(app.id)
              return (
                <Card
                  key={app.id}
                  hover
                  onClick={() => toggle(app.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 p-3.5",
                    active && "border-danger/35 bg-danger/[0.07]",
                  )}
                >
                  <div
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-md border transition-all",
                      active ? "border-danger bg-danger text-white" : "border-line-strong",
                    )}
                  >
                    {active && <Trash2 className="size-3" />}
                  </div>
                  {app.icon ? (
                    <img src={app.icon} alt="" className="size-8 shrink-0 rounded-lg object-contain" />
                  ) : (
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-[11px] font-bold text-subtle">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-fg">{app.name}</p>
                      {app.isStoreApp && (
                        <Badge tone="accent">
                          <Store className="size-3" /> Store
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted">
                      {app.publisher || "Unknown publisher"}
                      {app.version ? ` · v${app.version}` : ""}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        size="sm"
        icon={<Trash2 className="size-5 text-danger" />}
        title={`Uninstall ${selected.length} program${selected.length === 1 ? "" : "s"}?`}
        description="This action cannot be undone by Sparkle."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={uninstall}>
              Uninstall
            </Button>
          </>
        }
      >
        <ul className="space-y-1 text-xs">
          {apps
            .filter((a) => selected.includes(a.id))
            .map((a) => (
              <li key={a.id} className="rounded-lg border border-line bg-surface px-3 py-2 text-fg">
                {a.name}
              </li>
            ))}
        </ul>
      </Modal>
    </Page>
  )
}
