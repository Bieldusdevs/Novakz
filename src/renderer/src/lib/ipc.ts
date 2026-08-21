import { addListener, demoInvoke, demoSend, removeListener } from "./demoBridge"

type Listener = (event: unknown, ...args: any[]) => void

interface ElectronBridge {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>
    send: (channel: string, ...args: any[]) => void
    on: (channel: string, listener: Listener) => void
    removeListener: (channel: string, listener: Listener) => void
  }
}

const bridge = (globalThis as unknown as { electron?: ElectronBridge }).electron

/** True when running inside the packaged Electron shell. */
export const isElectron = Boolean(bridge?.ipcRenderer)

/** Invoke a main-process handler (falls back to the demo bridge in a browser). */
export function invoke<T = any>(channel: string, ...args: any[]): Promise<T> {
  if (isElectron) return bridge!.ipcRenderer.invoke(channel, ...args) as Promise<T>
  return demoInvoke(channel, ...args) as Promise<T>
}

/** Fire-and-forget message to the main process. */
export function send(channel: string, ...args: any[]): void {
  if (isElectron) bridge!.ipcRenderer.send(channel, ...args)
  else demoSend(channel, ...args)
}

/** Subscribe to a main-process event. Returns an unsubscribe function. */
export function on(channel: string, listener: Listener): () => void {
  if (isElectron) {
    bridge!.ipcRenderer.on(channel, listener)
    return () => bridge!.ipcRenderer.removeListener(channel, listener)
  }
  addListener(channel, listener)
  return () => removeListener(channel, listener)
}

/** Open an external URL in the user's default browser. */
export function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer")
}

export const ipc = { invoke, send, on, isElectron, openExternal }
export default ipc
