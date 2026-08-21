import demoTweaks from "@/assets/tweaks.demo.json"
import type { RestorePoint, SystemInfo, Tweak } from "../../../types"

/**
 * Browser fallback for the Electron IPC bridge.
 *
 * The real app runs inside Electron where `window.electron.ipcRenderer` exists.
 * When the renderer is opened in a plain browser (design preview / `pnpm dev:web`)
 * we emulate the main process with realistic demo data so every screen stays
 * interactive instead of crashing on a missing bridge.
 */

type Listener = (event: unknown, ...args: unknown[]) => void

const listeners = new Map<string, Set<Listener>>()

export function emit(channel: string, ...args: unknown[]): void {
  listeners.get(channel)?.forEach((cb) => cb({ demo: true }, ...args))
}

export function addListener(channel: string, cb: Listener): void {
  if (!listeners.has(channel)) listeners.set(channel, new Set())
  listeners.get(channel)!.add(cb)
}

export function removeListener(channel: string, cb: Listener): void {
  listeners.get(channel)?.delete(cb)
}

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

const store: Record<string, unknown> = {
  showTray: false,
  rpcEnabled: true,
}

let tweakStates: Record<string, boolean> = {
  "enable-game-mode": true,
  "disable-telemetry": true,
  "align-taskbar-left": true,
}

const demoInstalledApps = [
  { name: "Visual Studio Code", publisher: "Microsoft Corporation", version: "1.96.2" },
  { name: "Steam", publisher: "Valve Corporation", version: "3.4.1" },
  { name: "Discord", publisher: "Discord Inc.", version: "1.0.9182" },
  { name: "NVIDIA GeForce Experience", publisher: "NVIDIA Corporation", version: "3.28.0.417" },
  { name: "Spotify", publisher: "Spotify AB", version: "1.2.53" },
  { name: "7-Zip 24.09", publisher: "Igor Pavlov", version: "24.09" },
  { name: "Xbox Game Bar", publisher: "Microsoft Corporation", version: "5.824.1181.0" },
  { name: "Microsoft OneDrive", publisher: "Microsoft Corporation", version: "24.201.1006" },
  { name: "Cortana", publisher: "Microsoft Corporation", version: "4.2308.1005.0" },
  { name: "Solitaire Collection", publisher: "Microsoft Corporation", version: "4.19.3181.0" },
].map((a, i) => ({
  id: a.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
  name: a.name,
  publisher: a.publisher,
  version: a.version,
  installDate: `2025${String(10 + (i % 2)).padStart(2, "0")}${String(3 + i).padStart(2, "0")}`,
  uninstallString: "C:\\Program Files\\demo\\uninstall.exe",
  quietUninstallString: "",
  isStoreApp: i > 6,
  packageName: `Demo.${a.name.replace(/\s/g, "")}_8wekyb3d8bbwe`,
}))

let restorePoints: RestorePoint[] = [
  {
    SequenceNumber: 42,
    Description: "SparkleBackup-2026-08-19_10-24",
    CreationTime: "/Date(1755598000000)/",
    RestorePointType: 12,
  },
  {
    SequenceNumber: 41,
    Description: "Windows Update",
    CreationTime: "/Date(1755338000000)/",
    RestorePointType: 12,
  },
]

const demoSystemInfo: SystemInfo = {
  cpu_model: "AMD Ryzen 7 7800X3D 8-Core Processor",
  cpu_cores: 8,
  cpu_threads: 16,
  memory_total: 34359738368,
  memory_type: "DDR5",
  os: "Microsoft Windows 11 Pro",
  os_version: "24H2",
}

const handlers: Record<string, (...args: any[]) => unknown | Promise<unknown>> = {
  "get-admin-status": async () => true,
  "get-user-name": async () => "Preview",
  "get-system-info": async () => {
    await wait(450)
    setTimeout(() => {
      emit("system-info-extra", {
        gpu_model: "NVIDIA GeForce RTX 4070 Ti",
        vram: "12 GB",
        hasGPU: true,
        isNvidia: true,
        integrated_gpu: "AMD Radeon Graphics",
        hasIntegratedGPU: true,
      })
    }, 500)
    setTimeout(() => {
      emit("system-info-extra", { disk_model: "Samsung SSD 990 PRO 2TB", disk_size: "1.86 TB" })
    }, 900)
    return demoSystemInfo
  },

  "tweaks:fetch": async () => {
    await wait(320)
    return demoTweaks as unknown as Tweak[]
  },
  "tweak-states:load": async () => JSON.stringify(tweakStates),
  "tweak-states:save": async (payload: string) => {
    tweakStates = JSON.parse(payload)
    return true
  },
  "tweak:active": () => Object.keys(tweakStates).filter((k) => tweakStates[k]),
  "tweak:apply": async () => {
    await wait(700)
    return { success: true, output: "Demo mode: tweak applied." }
  },
  "tweak:unapply": async () => {
    await wait(600)
    return { success: true, output: "Demo mode: tweak reverted." }
  },
  "nvidia-inspector": async () => "Demo mode: NVIDIA profile imported.",

  "get-installed-apps": async () => {
    await wait(600)
    return demoInstalledApps
  },
  "reload-installed-apps": async () => true,
  "uninstall-apps": async (apps: { name: string }[]) => {
    for (const app of apps) {
      emit("uninstall-progress", app.name)
      await wait(700)
    }
    emit("uninstall-complete")
    return { success: true, results: apps.map((a) => ({ name: a.name, success: true })) }
  },

  "check-winget": async () => ({ success: true, installed: true }),
  "check-chocolatey": async () => ({ success: true, installed: false }),
  "install-winget": async () => ({ success: true }),
  "install-chocolatey": async () => ({ installed: true, version: "2.3.0" }),
  "handle-apps": async ({ action, apps }: { action: string; apps: string[] }) => {
    if (action === "check-installed") {
      await wait(500)
      emit("installed-apps-checked", { success: true, installed: apps.slice(0, 2) })
      return true
    }
    for (const appId of apps) {
      emit("install-start", { appId })
      for (const line of [
        `Found package ${appId}`,
        "Downloading installer...",
        "  ██████████████████  100%",
        action === "uninstall" ? "Successfully uninstalled" : "Successfully installed",
      ]) {
        await wait(420)
        emit("install-output", { appId, line })
      }
      emit("install-app-complete", { appId })
    }
    emit("install-complete")
    return true
  },

  "dns:get-current": async () => {
    await wait(350)
    return { success: true, data: [{ adapter: "Ethernet", servers: "1.1.1.1, 1.0.0.1" }] }
  },
  "dns:get-adapters": async () => ({
    success: true,
    data: [{ name: "Ethernet", description: "Realtek Gaming 2.5GbE Family Controller", status: "Up" }],
  }),
  "dns:apply": async () => {
    await wait(800)
    return { success: true, output: "Demo mode: DNS applied to all active adapters." }
  },
  "dns:reset": async () => {
    await wait(600)
    return { success: true, output: "Demo mode: DNS reset to DHCP." }
  },
  "dns:flush-cache": async () => ({ success: true, output: "DNS cache flushed." }),
  "dns:test": async () => ({ success: true, output: "Demo mode: nslookup ok (google.com)." }),
  "dns:ping-all": async () => {
    await wait(900)
    return {
      success: true,
      data: [
        { name: "Cloudflare", server: "1.1.1.1", latency: 8, status: "success" },
        { name: "Google", server: "8.8.8.8", latency: 14, status: "success" },
        { name: "OpenDNS", server: "208.67.222.222", latency: 27, status: "success" },
        { name: "Quad9", server: "9.9.9.9", latency: 19, status: "success" },
        { name: "AdGuard DNS", server: "94.140.14.14", latency: 41, status: "success" },
      ],
    }
  },

  "get-restore-points": async () => {
    await wait(500)
    return { success: true, points: restorePoints }
  },
  "create-sparkle-restore-point": async () => {
    await wait(1200)
    const label = `SparkleBackup-${new Date().toISOString().slice(0, 16)}`
    restorePoints = [
      {
        SequenceNumber: restorePoints.length + 43,
        Description: label,
        CreationTime: `/Date(${Date.now()})/`,
        RestorePointType: 12,
      },
      ...restorePoints,
    ]
    return { success: true, label }
  },
  "create-restore-point": async (name?: string) => {
    await wait(1200)
    const label = `${name || "ManualRestore"}-${new Date().toISOString().slice(0, 16)}`
    restorePoints = [
      {
        SequenceNumber: restorePoints.length + 43,
        Description: label,
        CreationTime: `/Date(${Date.now()})/`,
        RestorePointType: 12,
      },
      ...restorePoints,
    ]
    return { success: true, label }
  },
  "restore-restore-point": async () => ({ success: true }),
  "delete-all-restore-points": async () => {
    restorePoints = []
    return { success: true }
  },
  "delete-old-sparkle-backups": async () => ({ success: true, message: "Sparkle folder deleted" }),

  "run-powershell": async ({ name }: { name?: string } = {}) => {
    await wait(900)
    return { success: true, output: `Demo mode: script "${name ?? "script"}" finished.` }
  },
  "run-powershell-window": async () => ({ success: true }),
  restart: async () => ({ success: true }),
  "restart-explorer": async () => ({ success: true }),
  "clear-sparkle-cache": async () => ({ success: true }),
  "open-log-folder": async () => ({ success: true }),
  "open-devtools": async () => true,

  "tray:get": () => store.showTray,
  "tray:set": (value: boolean) => (store.showTray = value),
  "rpc-enabled:get": () => store.rpcEnabled,
  "rpc-enabled:set": (value: boolean) => (store.rpcEnabled = value),
  "start-discord-rpc": async () => true,
  "stop-discord-rpc": async () => true,

  "updater:get-version": () => "2.23.0",
  "updater:check": async () => {
    await wait(900)
    emit("updater:not-available", { currentVersion: "2.23.0" })
    return { ok: true }
  },
  "updater:download": async () => ({ ok: true }),
  "updater:install": async () => ({ ok: true }),
}

export async function demoInvoke(channel: string, ...args: unknown[]): Promise<unknown> {
  const handler = handlers[channel]
  if (!handler) {
    console.warn(`[demo bridge] unhandled channel: ${channel}`)
    return { success: false, error: `Channel "${channel}" is not available in preview mode.` }
  }
  return handler(...args)
}

export function demoSend(channel: string, ...args: unknown[]): void {
  console.info(`[demo bridge] send: ${channel}`, ...args)
}
