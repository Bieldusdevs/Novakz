import { create } from "zustand"

export type AppStatus = "queued" | "installing" | "done" | "error"

interface AppInstallState {
  apps: Record<string, AppStatus>
  output: Record<string, string[]>
  busy: boolean
  setAppStatus: (appId: string, status: AppStatus) => void
  appendOutput: (appId: string, line: string) => void
  setBusy: (busy: boolean) => void
  clearApps: () => void
}

const useAppInstallStore = create<AppInstallState>((set) => ({
  apps: {},
  output: {},
  busy: false,
  setAppStatus: (appId, status) =>
    set((state) => ({ apps: { ...state.apps, [appId]: status } })),
  appendOutput: (appId, line) =>
    set((state) => ({
      output: { ...state.output, [appId]: [...(state.output[appId] ?? []), line].slice(-200) },
    })),
  setBusy: (busy) => set({ busy }),
  clearApps: () => set({ apps: {}, busy: false }),
}))

export default useAppInstallStore
