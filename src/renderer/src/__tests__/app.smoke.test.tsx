// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { HashRouter } from "react-router-dom"
import { createElement } from "react"
import App from "../App"

/**
 * Renderer smoke tests: mount the whole app (with the demo IPC bridge) and make
 * sure each route renders without throwing.
 */

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

const renderApp = async (hash: string): Promise<void> => {
  window.location.hash = hash
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(createElement(HashRouter, null, createElement(App)))
  })
}

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe("renderer", () => {
  beforeAll(() => {
    window.matchMedia =
      window.matchMedia ||
      ((query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList)
  })

  const routes: [string, string][] = [
    ["#/", "Quick actions"],
    ["#/tweaks", "Tweaks"],
    ["#/clean", "Clean"],
    ["#/apps", "Apps"],
    ["#/dns", "DNS"],
    ["#/utilities", "Utilities"],
    ["#/backup", "Backup"],
    ["#/settings", "Settings"],
    ["#/debloat", "Debloat"],
  ]

  it.each(routes)("renders %s", async (hash, expected) => {
    await renderApp(hash)
    expect(container?.textContent).toContain(expected)
  })

  it("shows the window controls", async () => {
    await renderApp("#/")
    expect(container?.querySelector('[aria-label="Close"]')).toBeTruthy()
    expect(container?.querySelector('[aria-label="Toggle sidebar"]')).toBeTruthy()
  })
})
