import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import {
  Sparkles,
  RefreshCw,
  Info,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Filter,
} from "lucide-react"
import { Page, EmptyState } from "@/components/ui/page"
import { Card } from "@/components/ui/card"
import Button from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { SearchInput } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import Modal from "@/components/ui/modal"
import { invoke, openExternal } from "@/lib/ipc"
import { cn, titleCase } from "@/lib/utils"
import type { Tweak } from "../../../types"

const riskMeta: Record<string, { tone: "success" | "warning" | "danger"; icon: React.ReactNode }> = {
  safe: { tone: "success", icon: <ShieldCheck className="size-3" /> },
  medium: { tone: "warning", icon: <AlertTriangle className="size-3" /> },
  risky: { tone: "danger", icon: <Flame className="size-3" /> },
}

const categoriesOf = (tweak: Tweak): string[] =>
  Array.isArray(tweak.category) ? tweak.category : tweak.category ? [tweak.category] : ["General"]

export default function Tweaks(): React.ReactNode {
  const [tweaks, setTweaks] = useState<Tweak[]>([])
  const [states, setStates] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [pending, setPending] = useState<string | null>(null)
  const [details, setDetails] = useState<Tweak | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, raw] = await Promise.all([
        invoke<Tweak[]>("tweaks:fetch"),
        invoke<string>("tweak-states:load"),
      ])
      setTweaks(list ?? [])
      setStates(JSON.parse(raw || "{}"))
    } catch {
      toast.error("Could not load tweaks.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const categories = useMemo(() => {
    const set = new Set<string>()
    tweaks.forEach((t) => categoriesOf(t).forEach((c) => set.add(c)))
    return ["All", ...Array.from(set).sort()]
  }, [tweaks])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tweaks
      .filter((t) => category === "All" || categoriesOf(t).includes(category))
      .filter(
        (t) =>
          !q ||
          (t.title ?? t.name).toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => Number(Boolean(b.top)) - Number(Boolean(a.top)))
  }, [tweaks, query, category])

  const appliedCount = Object.values(states).filter(Boolean).length

  const persist = async (next: Record<string, boolean>): Promise<void> => {
    setStates(next)
    await invoke("tweak-states:save", JSON.stringify(next)).catch(() => undefined)
  }

  const toggle = async (tweak: Tweak, next: boolean): Promise<void> => {
    if (!next && tweak.reversible === false) {
      toast.warn(`"${tweak.title ?? tweak.name}" cannot be reverted automatically.`)
      return
    }
    setPending(tweak.name)
    try {
      const result = await invoke<{ success?: boolean; error?: string }>(
        next ? "tweak:apply" : "tweak:unapply",
        tweak.name,
      )
      if (result && result.success === false) throw new Error(result.error)
      await persist({ ...states, [tweak.name]: next })
      toast.success(`${tweak.title ?? titleCase(tweak.name)} ${next ? "applied" : "reverted"}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The tweak could not be applied.")
    } finally {
      setPending(null)
    }
  }

  const applyRecommended = async (): Promise<void> => {
    const targets = tweaks.filter((t) => t.recommended && !states[t.name])
    if (!targets.length) {
      toast.info("All recommended tweaks are already applied.")
      return
    }
    for (const tweak of targets) await toggle(tweak, true)
  }

  return (
    <Page
      title="Tweaks"
      description={`${appliedCount} applied · ${tweaks.length} available`}
      icon={<Sparkles className="size-5" />}
      actions={
        <>
          <Button variant="ghost" icon={<RefreshCw className="size-4" />} onClick={load}>
            Refresh
          </Button>
          <Button variant="primary" icon={<Sparkles className="size-4" />} onClick={applyRecommended}>
            Apply recommended
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tweaks…"
            className="min-w-56"
          />
          <div className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto">
            <Filter className="size-3.5 shrink-0 text-subtle" />
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
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<Sparkles className="size-5" />}
            title="No tweaks found"
            description="Try a different search term or category filter."
          />
        )}

        {!loading && (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((tweak) => {
              const enabled = Boolean(states[tweak.name])
              const risk = riskMeta[String(tweak.risk ?? "safe")] ?? riskMeta.safe
              return (
                <Card
                  key={tweak.name}
                  hover
                  className={cn(
                    "p-4 transition-colors",
                    enabled && "border-primary/30 bg-primary/[0.06]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-fg">
                          {tweak.title ?? titleCase(tweak.name)}
                        </h3>
                        <Badge tone={risk.tone}>
                          {risk.icon}
                          {String(tweak.risk ?? "safe")}
                        </Badge>
                        {tweak.recommended && <Badge tone="primary">Recommended</Badge>}
                        {tweak.reversible === false && <Badge tone="warning">One-way</Badge>}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                        {tweak.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {categoriesOf(tweak).map((c) => (
                          <span
                            key={c}
                            className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-subtle"
                          >
                            {c}
                          </span>
                        ))}
                        <button
                          onClick={() => setDetails(tweak)}
                          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-muted transition hover:text-primary"
                        >
                          <Info className="size-3" /> Details
                        </button>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {pending === tweak.name ? (
                        <RefreshCw className="size-4 animate-spin text-primary" />
                      ) : (
                        <Switch
                          checked={enabled}
                          onChange={(next) => toggle(tweak, next)}
                          label={tweak.title ?? tweak.name}
                        />
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        size="lg"
        icon={<Sparkles className="size-5" />}
        title={details?.title ?? titleCase(details?.name ?? "")}
        description={details?.description}
        footer={
          <Button variant="primary" size="sm" onClick={() => setDetails(null)}>
            Close
          </Button>
        }
      >
        {details && (
          <div className="space-y-4">
            <p className="whitespace-pre-line text-xs leading-relaxed">
              {details.deepDescription ?? details.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={(riskMeta[String(details.risk ?? "safe")] ?? riskMeta.safe).tone}>
                Risk: {String(details.risk ?? "safe")}
              </Badge>
              <Badge tone={details.reversible === false ? "warning" : "neutral"}>
                {details.reversible === false ? "Not reversible" : "Reversible"}
              </Badge>
              {details.updatedversion && <Badge>Updated in v{details.updatedversion}</Badge>}
            </div>
            {details.links && details.links.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  References
                </p>
                {details.links.map((link) => (
                  <button
                    key={link.url}
                    onClick={() => openExternal(link.url)}
                    className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-left text-xs text-muted transition hover:border-line-strong hover:text-fg"
                  >
                    <ExternalLink className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">{link.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Page>
  )
}
