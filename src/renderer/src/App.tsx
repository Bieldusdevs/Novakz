import { useState, useEffect, useCallback } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer, Slide, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./app.css"

import TitleBar from "./components/titlebar"
import Nav from "./components/nav"
import FirstTime from "./components/firsttime"
import UpdateManager from "./components/updatemanager"
import ChangelogModal from "./components/changelogModal"
import NoAdmin from "./components/noAdmin"

import Home from "./pages/Home"
import Tweaks from "./pages/Tweaks"
import Debloat from "./pages/Debloat"
import Clean from "./pages/Clean"
import Apps from "./pages/Apps"
import Utilities from "./pages/Utilities"
import DNS from "./pages/DNS"
import Settings from "./pages/Settings"
import Backup from "./pages/Backup"

import useAppInstallStore from "./store/appInstallStore"
import useOnlineStore from "./store/online"
import useSettingsStore from "./store/settings"
import { CURRENT_VERSION } from "./lib/version"
import { invoke, on } from "./lib/ipc"
import { cn } from "./lib/utils"

function App(): React.ReactNode {
  const { theme, sidebarCollapsed, setSidebarCollapsed } = useSettingsStore()
  const [adminStatus, setAdminStatus] = useState<boolean | null>(null)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const { setAppStatus, appendOutput, clearApps } = useAppInstallStore()
  const { setOnline } = useOnlineStore()

  /* ---------------- app install / uninstall events ---------------- */
  useEffect(() => {
    const offs = [
      on("install-start", (_e, { appId }: { appId: string }) => setAppStatus(appId, "installing")),
      on("install-output", (_e, { appId, line }: { appId: string; line: string }) =>
        appendOutput(appId, line),
      ),
      on("install-app-complete", (_e, { appId }: { appId: string }) => setAppStatus(appId, "done")),
      on("install-app-error", (_e, { appId }: { appId: string }) => setAppStatus(appId, "error")),
      on("install-complete", () => {
        useAppInstallStore.getState().setBusy(false)
        toast.success("Operation completed successfully!")
      }),
      on("install-error", () => {
        clearApps()
        toast.error("There was an error during the operation. Please try again.")
      }),
    ]
    return () => offs.forEach((off) => off())
  }, [setAppStatus, appendOutput, clearApps])

  /* ---------------- theming ---------------- */
  useEffect(() => {
    const applyTheme = (value: string): void => {
      document.body.classList.remove("light", "purple", "dark", "gray", "classic")
      const resolved =
        value === "system" || !value
          ? window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark"
          : value
      document.body.classList.add(resolved)
      document.body.setAttribute("data-theme", resolved)
    }

    applyTheme(theme)
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = (): void => {
      if (theme === "system") applyTheme("system")
    }
    mediaQuery.addEventListener("change", handleSystemThemeChange)
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange)
  }, [theme])

  /* ---------------- connectivity ---------------- */
  useEffect(() => {
    const handleOnline = (): void => setOnline(true)
    const handleOffline = (): void => setOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [setOnline])

  /* ---------------- changelog + admin ---------------- */
  useEffect(() => {
    const lastSeen = localStorage.getItem("sparkle:changelogSeenVersion")
    if (lastSeen !== CURRENT_VERSION) {
      const timer = setTimeout(() => setChangelogOpen(true), 700)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [])

  useEffect(() => {
    invoke<boolean>("get-admin-status").then(setAdminStatus).catch(() => setAdminStatus(null))
  }, [])

  const toggleSidebar = useCallback(
    () => setSidebarCollapsed(!sidebarCollapsed),
    [sidebarCollapsed, setSidebarCollapsed],
  )

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-bg text-fg">
      <div className="aurora" />
      <div className="grid-lines" />

      <TitleBar
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        adminStatus={adminStatus}
      />
      <Nav collapsed={sidebarCollapsed} />

      <div className="relative z-10 flex flex-1 pt-12">
        <main
          className={cn(
            "flex-1 overflow-hidden px-7 py-6 transition-all duration-300 ease-out",
            sidebarCollapsed ? "ml-16" : "ml-56",
          )}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tweaks" element={<Tweaks />} />
            <Route path="/debloat" element={<Debloat />} />
            <Route path="/clean" element={<Clean />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/utilities" element={<Utilities />} />
            <Route path="/dns" element={<DNS />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <FirstTime />
      <ChangelogModal
        open={changelogOpen}
        onClose={() => {
          localStorage.setItem("sparkle:changelogSeenVersion", CURRENT_VERSION)
          setChangelogOpen(false)
        }}
      />
      <NoAdmin open={adminStatus === false} onClose={() => setAdminStatus(true)} />
      <UpdateManager />

      <ToastContainer
        stacked
        limit={4}
        position="bottom-right"
        theme="dark"
        transition={Slide}
        hideProgressBar
        autoClose={3200}
        pauseOnFocusLoss={false}
      />
    </div>
  )
}

export default App
