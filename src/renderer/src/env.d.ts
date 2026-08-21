/// <reference types="vite/client" />

interface ElectronIpcRenderer {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  send: (channel: string, ...args: unknown[]) => void
  on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void
  removeListener: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void
}

interface Window {
  electron?: { ipcRenderer: ElectronIpcRenderer }
  api?: unknown
}
