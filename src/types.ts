export interface SystemInfo {
  cpu_model: string
  cpu_cores: number
  cpu_threads: number
  memory_total: number
  memory_type: string
  os: string
  os_version: string
  gpu_model?: string
  vram?: string | number
  hasGPU?: boolean
  isNvidia?: boolean
  integrated_gpu?: string
  hasIntegratedGPU?: boolean
  disk_model?: string
  disk_size?: string
}

export interface Tweak {
  name: string
  title?: string
  description?: string
  deepDescription?: string
  risk?: "safe" | "medium" | "risky" | string
  category?: string[] | string
  recommended?: boolean
  top?: boolean
  reversible?: boolean
  modal?: string
  updatedversion?: string
  links?: { name: string; url: string }[]
  psapply?: string
  psunapply?: string
  [key: string]: unknown
}

export interface InstalledApp {
  id: string
  name: string
  publisher: string
  version: string
  installDate: string
  icon?: string
  uninstallString: string
  quietUninstallString: string
  isStoreApp: boolean
  packageName: string
}

export interface CatalogApp {
  name: string
  id: string
  chocolatey?: string
  category: string
  info: string
  link?: string
  icon?: string
}

export interface RestorePoint {
  SequenceNumber: number
  Description: string
  CreationTime: string
  EventType?: number | string
  RestorePointType?: number | string
}

export interface PowerShellResult {
  success: boolean
  output?: string
  error?: string
}
