import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import { Trash2, Sparkles, CheckCircle2, Loader2, Terminal } from "lucide-react"
import { Page } from "@/components/ui/page"
import { Card } from "@/components/ui/card"
import Button from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { invoke } from "@/lib/ipc"
import { cn } from "@/lib/utils"

interface CleanTask {
  id: string
  title: string
  description: string
  danger?: boolean
  script: string
}

const TASKS: CleanTask[] = [
  {
    id: "temp",
    title: "Temporary files",
    description: "Clears %TEMP% and the Windows temp folder.",
    script: `Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\\Windows\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue`,
  },
  {
    id: "prefetch",
    title: "Prefetch cache",
    description: "Removes stale prefetch entries used for app pre-loading.",
    script: `Remove-Item -Path "C:\\Windows\\Prefetch\\*" -Recurse -Force -ErrorAction SilentlyContinue`,
  },
  {
    id: "recycle",
    title: "Recycle Bin",
    description: "Permanently empties the Recycle Bin for every drive.",
    danger: true,
    script: `Clear-RecycleBin -Force -ErrorAction SilentlyContinue`,
  },
  {
    id: "winupdate",
    title: "Windows Update cache",
    description: "Deletes downloaded update packages in SoftwareDistribution.",
    script: `Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\\Windows\\SoftwareDistribution\\Download\\*" -Recurse -Force -ErrorAction SilentlyContinue
Start-Service -Name wuauserv -ErrorAction SilentlyContinue`,
  },
  {
    id: "dns",
    title: "DNS resolver cache",
    description: "Flushes cached hostname lookups.",
    script: `ipconfig /flushdns`,
  },
  {
    id: "thumbnails",
    title: "Thumbnail cache",
    description: "Rebuilds Explorer thumbnail databases.",
    script: `Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\thumbcache_*.db" -Force -ErrorAction SilentlyContinue`,
  },
  {
    id: "eventlogs",
    title: "Event logs",
    description: "Clears Windows event logs to reclaim space.",
    danger: true,
    script: `wevtutil el | ForEach-Object { wevtutil cl "$_" 2>$null }`,
  },
  {
    id: "delivery",
    title: "Delivery Optimization files",
    description: "Removes peer-to-peer update cache.",
    script: `Delete-DeliveryOptimizationCache -Force -ErrorAction SilentlyContinue`,
  },
]

type TaskState = "idle" | "running" | "done" | "error"

export default function Clean(): React.ReactNode {
  const [selected, setSelected] = useState<string[]>(["temp", "prefetch", "dns", "thumbnails"])
  const [status, setStatus] = useState<Record<string, TaskState>>({})
  const [running, setRunning] = useState(false)
  const [logLines, setLogLines] = useState<string[]>([])

  const progress = useMemo(() => {
    if (!running && !Object.keys(status).length) return 0
    const done = Object.values(status).filter((s) => s === "done" || s === "error").length
    return selected.length ? (done / selected.length) * 100 : 0
  }, [status, selected, running])

  const toggle = (id: string): void =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const run = async (): Promise<void> => {
    if (!selected.length) {
      toast.info("Select at least one cleanup task.")
      return
    }
    setRunning(true)
    setStatus({})
    setLogLines([])
    for (const id of selected) {
      const task = TASKS.find((t) => t.id === id)!
      setStatus((s) => ({ ...s, [id]: "running" }))
      setLogLines((l) => [...l, `> ${task.title}`])
      try {
        const result = await invoke<{ success: boolean; output?: string; error?: string }>(
          "run-powershell",
          { script: task.script, name: `Clean-${task.id}` },
        )
        setStatus((s) => ({ ...s, [id]: result?.success === false ? "error" : "done" }))
        setLogLines((l) => [
          ...l,
          (result?.output || result?.error || "completed").trim().split("\n").slice(-3).join("\n"),
        ])
      } catch (error) {
        setStatus((s) => ({ ...s, [id]: "error" }))
        setLogLines((l) => [...l, String(error)])
      }
    }
    setRunning(false)
    toast.success("Cleanup finished.")
  }

  return (
    <Page
      title="Clean"
      description="Reclaim disk space and clear system caches."
      icon={<Trash2 className="size-5" />}
      actions={
        <>
          <Button
            variant="ghost"
            onClick={() => setSelected(selected.length === TASKS.length ? [] : TASKS.map((t) => t.id))}
          >
            {selected.length === TASKS.length ? "Clear selection" : "Select all"}
          </Button>
          <Button
            variant="primary"
            loading={running}
            icon={<Sparkles className="size-4" />}
            onClick={run}
          >
            Clean {selected.length ? `(${selected.length})` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {(running || progress > 0) && (
          <Card className="p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-fg">
                {running ? "Cleaning your system…" : "Cleanup complete"}
              </span>
              <span className="text-muted">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="mt-3" />
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {TASKS.map((task) => {
            const active = selected.includes(task.id)
            const state = status[task.id]
            return (
              <Card
                key={task.id}
                hover
                onClick={() => !running && toggle(task.id)}
                className={cn(
                  "cursor-pointer p-4",
                  active && "border-primary/35 bg-primary/[0.06]",
                  running && "cursor-not-allowed opacity-80",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all",
                      active ? "border-primary bg-primary text-primary-fg" : "border-line-strong",
                    )}
                  >
                    {active && <CheckCircle2 className="size-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{task.title}</p>
                      {task.danger && <Badge tone="warning">Careful</Badge>}
                      {state === "running" && <Loader2 className="size-3.5 animate-spin text-primary" />}
                      {state === "done" && <Badge tone="success">Done</Badge>}
                      {state === "error" && <Badge tone="danger">Failed</Badge>}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{task.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {logLines.length > 0 && (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <Terminal className="size-3.5 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Output</p>
            </div>
            <pre className="scroll-area max-h-56 whitespace-pre-wrap px-4 py-3 font-mono text-[11px] leading-relaxed text-muted">
              {logLines.join("\n")}
            </pre>
          </Card>
        )}
      </div>
    </Page>
  )
}
