import { create } from "zustand"

interface OnlineState {
  online: boolean
  setOnline: (online: boolean) => void
}

const useOnlineStore = create<OnlineState>((set) => ({
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  setOnline: (online) => set({ online }),
}))

export default useOnlineStore
