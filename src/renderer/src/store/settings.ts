import { create } from "zustand"

export type ThemeName = "system" | "dark" | "light" | "purple" | "gray" | "classic"

interface SettingsState {
  theme: ThemeName
  sidebarCollapsed: boolean
  setTheme: (theme: ThemeName) => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : (JSON.parse(value) as T)
  } catch {
    return fallback
  }
}

const useSettingsStore = create<SettingsState>((set) => ({
  theme: read<ThemeName>("theme", "dark"),
  sidebarCollapsed: read<boolean>("sidebarCollapsed", false),
  setTheme: (theme) => {
    localStorage.setItem("theme", JSON.stringify(theme))
    set({ theme })
  },
  setSidebarCollapsed: (sidebarCollapsed) => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed))
    set({ sidebarCollapsed })
  },
}))

export default useSettingsStore
