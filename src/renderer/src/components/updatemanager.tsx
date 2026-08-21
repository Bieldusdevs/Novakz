import { useEffect, useState } from "react"
import { Download, RefreshCw, CheckCircle2 } from "lucide-react"
import { invoke, on } from "@/lib/ipc"
import Button from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type Phase = "idle" | "available" | "downloading" | "ready"

export default function UpdateManager(): React.ReactNode {
  const [phase, setPhase] = useState<Phase>("idle")
  const [version, setVersion] = useState("")
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const offs = [
      on("updater:available", (_e, info: { version: string }) => {
        setVersion(info?.version ?? "")
        setPhase("available")
      }),
      on("updater:download-progress", (_e, p: { percent: number }) =>
        setPercent(Math.round(p?.percent ?? 0)),
      ),
      on("updater:downloaded", (_e, info: { version: string }) => {
        setVersion(info?.version ?? "")
        setPhase("ready")
      }),
    ]
    invoke("updater:check").catch(() => undefined)
    return () => offs.forEach((off) => off())
  }, [])

  if (phase === "idle") return null

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] w-[min(30rem,calc(100%-3rem))] -translate-x-1/2 animate-fade-up">
      <div className="glass flex items-center gap-4 rounded-2xl px-4 py-3 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.9)]">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          {phase === "ready" ? (
            <CheckCircle2 className="size-4" />
          ) : phase === "downloading" ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-fg">
            {phase === "ready"
              ? `Sparkle ${version} is ready to install`
              : phase === "downloading"
                ? `Downloading ${version}… ${percent}%`
                : `Sparkle ${version} is available`}
          </p>
          {phase === "downloading" ? (
            <Progress value={percent} className="mt-2" />
          ) : (
            <p className="mt-0.5 text-[11px] text-muted">
              {phase === "ready" ? "Restart to apply the update." : "Download it in the background."}
            </p>
          )}
        </div>
        {phase !== "downloading" && (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPhase("idle")}>
              Later
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (phase === "ready") invoke("updater:install")
                else {
                  setPhase("downloading")
                  invoke("updater:download")
                }
              }}
            >
              {phase === "ready" ? "Restart" : "Download"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
