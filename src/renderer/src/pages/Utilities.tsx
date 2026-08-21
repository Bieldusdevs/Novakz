import { useState } from "react"
import { toast } from "react-toastify"
import {
  Wrench,
  Terminal,
  Settings2,
  Activity,
  HardDrive,
  Network,
  ShieldCheck,
  RefreshCw,
  Cpu,
  FolderCog,
  Power,
  MonitorCog,
} from "lucide-react"
import { Page } from "@/components/ui/page"
import { Card } from "@/components/ui/card"
import Button from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { invoke } from "@/lib/ipc"

interface Utility {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  group: "Windows tools" | "Maintenance" | "Diagnostics"
  danger?: boolean
  run: () => Promise<unknown>
}

const openTool = (command: string, name: string) => (): Promise<unknown> =>
  invoke("run-powershell", { script: `Start-Process ${command}`, name })

const inWindow = (script: string, name: string) => (): Promise<unknown> =>
  invoke("run-powershell-window", { script, name })

const UTILITIES: Utility[] = [
  {
    id: "taskmgr",
    title: "Task Manager",
    description: "Inspect processes, startup impact and resource usage.",
    icon: <Activity className="size-4" />,
    group: "Windows tools",
    run: openTool("taskmgr", "Open-TaskManager"),
  },
  {
    id: "msconfig",
    title: "System Configuration",
    description: "Boot options and service startup behaviour.",
    icon: <Settings2 className="size-4" />,
    group: "Windows tools",
    run: openTool("msconfig", "Open-Msconfig"),
  },
  {
    id: "regedit",
    title: "Registry Editor",
    description: "Browse and edit the Windows registry.",
    icon: <FolderCog className="size-4" />,
    group: "Windows tools",
    danger: true,
    run: openTool("regedit", "Open-Regedit"),
  },
  {
    id: "devmgmt",
    title: "Device Manager",
    description: "Drivers and hardware troubleshooting.",
    icon: <Cpu className="size-4" />,
    group: "Windows tools",
    run: openTool("devmgmt.msc", "Open-DeviceManager"),
  },
  {
    id: "diskmgmt",
    title: "Disk Management",
    description: "Partitions, volumes and drive letters.",
    icon: <HardDrive className="size-4" />,
    group: "Windows tools",
    run: openTool("diskmgmt.msc", "Open-DiskManagement"),
  },
  {
    id: "powercfg",
    title: "Power Options",
    description: "Switch between balanced and high performance plans.",
    icon: <Power className="size-4" />,
    group: "Windows tools",
    run: openTool("powercfg.cpl", "Open-PowerOptions"),
  },
  {
    id: "explorer",
    title: "Restart Explorer",
    description: "Fixes a frozen taskbar or desktop after tweaks.",
    icon: <RefreshCw className="size-4" />,
    group: "Maintenance",
    run: () => invoke("restart-explorer"),
  },
  {
    id: "sfc",
    title: "SFC scan",
    description: "Repairs corrupted Windows system files.",
    icon: <ShieldCheck className="size-4" />,
    group: "Maintenance",
    run: inWindow("sfc /scannow", "SFC-Scan"),
  },
  {
    id: "dism",
    title: "DISM restore health",
    description: "Repairs the component store used by Windows Update.",
    icon: <MonitorCog className="size-4" />,
    group: "Maintenance",
    run: inWindow("DISM /Online /Cleanup-Image /RestoreHealth", "DISM-RestoreHealth"),
  },
  {
    id: "chkdsk",
    title: "Check disk",
    description: "Schedules a file-system integrity scan on C:.",
    icon: <HardDrive className="size-4" />,
    group: "Maintenance",
    danger: true,
    run: inWindow("chkdsk C: /scan", "Chkdsk-Scan"),
  },
  {
    id: "netreset",
    title: "Reset network stack",
    description: "Winsock + TCP/IP reset (requires reboot).",
    icon: <Network className="size-4" />,
    group: "Maintenance",
    danger: true,
    run: inWindow("netsh winsock reset; netsh int ip reset", "Reset-Network"),
  },
  {
    id: "battery",
    title: "Battery report",
    description: "Generates an HTML battery health report.",
    icon: <Activity className="size-4" />,
    group: "Diagnostics",
    run: inWindow("powercfg /batteryreport /output \"$env:USERPROFILE\\battery-report.html\"", "Battery-Report"),
  },
  {
    id: "systeminfo",
    title: "System information",
    description: "Full hardware and OS inventory in a console window.",
    icon: <Terminal className="size-4" />,
    group: "Diagnostics",
    run: inWindow("systeminfo", "System-Info"),
  },
  {
    id: "reliability",
    title: "Reliability monitor",
    description: "Timeline of crashes, hangs and failed updates.",
    icon: <Activity className="size-4" />,
    group: "Diagnostics",
    run: openTool("perfmon /rel", "Open-Reliability"),
  },
]

const GROUPS = ["Windows tools", "Maintenance", "Diagnostics"] as const

export default function Utilities(): React.ReactNode {
  const [busy, setBusy] = useState<string | null>(null)

  const run = async (utility: Utility): Promise<void> => {
    setBusy(utility.id)
    try {
      await utility.run()
      toast.success(`${utility.title} launched.`)
    } catch {
      toast.error(`${utility.title} could not be started.`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Page
      title="Utilities"
      description="Shortcuts to the Windows tools power users actually need."
      icon={<Wrench className="size-5" />}
    >
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <section key={group}>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-subtle">
              {group}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {UTILITIES.filter((u) => u.group === group).map((utility) => (
                <Card key={utility.id} hover className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-primary">
                      {utility.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-fg">{utility.title}</p>
                        {utility.danger && <Badge tone="warning">Advanced</Badge>}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">
                        {utility.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full justify-center"
                    loading={busy === utility.id}
                    onClick={() => run(utility)}
                  >
                    Launch
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Page>
  )
}
