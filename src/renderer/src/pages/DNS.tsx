import { useCallback, useEffect, useState } from "react"
import { toast } from "react-toastify"
import { Globe, Gauge, RotateCcw, Waves, Network, Check } from "lucide-react"
import { Page } from "@/components/ui/page"
import { Card } from "@/components/ui/card"
import Button from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Input from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { invoke } from "@/lib/ipc"
import { cn } from "@/lib/utils"

interface Provider {
  id: string
  name: string
  primary: string
  secondary: string
  blurb: string
}

const PROVIDERS: Provider[] = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    primary: "1.1.1.1",
    secondary: "1.0.0.1",
    blurb: "Fastest public resolver, privacy focused.",
  },
  {
    id: "google",
    name: "Google",
    primary: "8.8.8.8",
    secondary: "8.8.4.4",
    blurb: "Reliable global infrastructure.",
  },
  {
    id: "quad9",
    name: "Quad9",
    primary: "9.9.9.9",
    secondary: "149.112.112.112",
    blurb: "Blocks known malicious domains.",
  },
  {
    id: "adguard",
    name: "AdGuard",
    primary: "94.140.14.14",
    secondary: "94.140.15.15",
    blurb: "Filters ads and trackers network-wide.",
  },
  {
    id: "opendns",
    name: "OpenDNS",
    primary: "208.67.222.222",
    secondary: "208.67.220.220",
    blurb: "Cisco-backed with content filtering.",
  },
  {
    id: "automatic",
    name: "Automatic (DHCP)",
    primary: "—",
    secondary: "—",
    blurb: "Use whatever your router provides.",
  },
]

interface PingResult {
  name: string
  server: string
  latency: number | null
  status: string
}

export default function DNS(): React.ReactNode {
  const [current, setCurrent] = useState<{ adapter: string; servers: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [pings, setPings] = useState<PingResult[]>([])
  const [pinging, setPinging] = useState(false)
  const [customPrimary, setCustomPrimary] = useState("")
  const [customSecondary, setCustomSecondary] = useState("")

  const loadCurrent = useCallback(async () => {
    setLoading(true)
    try {
      const result = await invoke<{ success: boolean; data?: { adapter: string; servers: string }[] }>(
        "dns:get-current",
      )
      setCurrent(result?.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrent()
  }, [loadCurrent])

  const apply = async (dnsType: string, primaryDNS?: string, secondaryDNS?: string): Promise<void> => {
    setApplying(dnsType)
    try {
      const result = await invoke<{ success: boolean; output?: string; error?: string }>("dns:apply", {
        dnsType,
        primaryDNS,
        secondaryDNS,
      })
      if (result?.success) {
        toast.success(result.output?.split("\n").pop() ?? "DNS updated.")
        loadCurrent()
      } else toast.error(result?.error ?? "Could not apply DNS settings.")
    } finally {
      setApplying(null)
    }
  }

  const benchmark = async (): Promise<void> => {
    setPinging(true)
    try {
      const result = await invoke<{ success: boolean; data?: PingResult[] }>("dns:ping-all")
      setPings(result?.data ?? [])
    } finally {
      setPinging(false)
    }
  }

  const fastest = pings
    .filter((p) => typeof p.latency === "number")
    .sort((a, b) => (a.latency ?? 999) - (b.latency ?? 999))[0]

  return (
    <Page
      title="DNS"
      description="Switch resolvers, benchmark latency and flush the cache."
      icon={<Globe className="size-5" />}
      actions={
        <>
          <Button
            variant="ghost"
            icon={<Waves className="size-4" />}
            onClick={async () => {
              await invoke("dns:flush-cache")
              toast.success("DNS cache flushed.")
            }}
          >
            Flush cache
          </Button>
          <Button
            variant="ghost"
            icon={<RotateCcw className="size-4" />}
            onClick={async () => {
              await invoke("dns:reset")
              toast.success("Reverted to automatic DNS.")
              loadCurrent()
            }}
          >
            Reset
          </Button>
          <Button variant="primary" loading={pinging} icon={<Gauge className="size-4" />} onClick={benchmark}>
            Benchmark
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Network className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-fg">Active configuration</h3>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {loading && <Skeleton className="h-12 w-full rounded-xl" />}
            {!loading && current.length === 0 && (
              <p className="text-xs text-muted">No adapters reporting DNS servers.</p>
            )}
            {current.map((entry) => (
              <div
                key={entry.adapter}
                className="rounded-xl border border-line bg-surface px-3.5 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  {entry.adapter}
                </p>
                <p className="mt-1 font-mono text-xs text-fg">{entry.servers}</p>
              </div>
            ))}
          </div>
        </Card>

        {pings.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-fg">Latency benchmark</h3>
            <div className="mt-3 space-y-2">
              {pings.map((p) => {
                const width = p.latency ? Math.min(100, (p.latency / 80) * 100) : 100
                return (
                  <div key={p.server} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-fg">{p.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          p === fastest
                            ? "bg-gradient-to-r from-success to-accent"
                            : "bg-gradient-to-r from-primary/70 to-accent-2/70",
                        )}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-xs text-muted">
                      {p.latency !== null ? `${p.latency} ms` : "timeout"}
                    </span>
                  </div>
                )
              })}
            </div>
            {fastest && (
              <p className="mt-3 text-[11px] text-muted">
                Fastest resolver: <span className="font-semibold text-success">{fastest.name}</span> at{" "}
                {fastest.latency} ms.
              </p>
            )}
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PROVIDERS.map((provider) => {
            const isActive = current.some((c) => c.servers.includes(provider.primary))
            return (
              <Card key={provider.id} hover className={cn("p-4", isActive && "border-primary/35 bg-primary/[0.06]")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-fg">{provider.name}</h3>
                      {isActive && (
                        <Badge tone="success">
                          <Check className="size-3" /> In use
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">{provider.blurb}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="font-mono text-[11px] text-subtle">
                    <p>{provider.primary}</p>
                    <p>{provider.secondary}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isActive ? "secondary" : "primary"}
                    loading={applying === provider.id}
                    onClick={() => apply(provider.id)}
                  >
                    {isActive ? "Reapply" : "Apply"}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-fg">Custom resolver</h3>
          <p className="mt-1 text-[11px] text-muted">Provide IPv4 addresses for every active adapter.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input
              value={customPrimary}
              onChange={(e) => setCustomPrimary(e.target.value)}
              placeholder="Primary · 1.1.1.1"
              className="font-mono"
            />
            <Input
              value={customSecondary}
              onChange={(e) => setCustomSecondary(e.target.value)}
              placeholder="Secondary · 1.0.0.1"
              className="font-mono"
            />
            <Button
              variant="primary"
              loading={applying === "custom"}
              onClick={() => apply("custom", customPrimary, customSecondary)}
              disabled={!customPrimary}
            >
              Apply
            </Button>
          </div>
        </Card>
      </div>
    </Page>
  )
}
