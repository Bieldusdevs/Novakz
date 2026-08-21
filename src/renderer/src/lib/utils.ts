import clsx, { type ClassValue } from "clsx"

/** Tiny className helper (clsx only – no tailwind-merge needed here). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/** Parse both ISO strings and the PowerShell `/Date(…)/` format. */
export function formatDate(value?: string | number): string {
  if (!value) return "Unknown"
  const raw = String(value)
  const match = raw.match(/\/Date\((\d+)\)\//)
  const date = match ? new Date(Number(match[1])) : new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function titleCase(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
