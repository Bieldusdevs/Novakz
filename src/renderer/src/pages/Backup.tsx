import { useCallback, useEffect, useState } from "react"
import { toast } from "react-toastify"
import { Archive, Plus, RefreshCw, RotateCcw, Trash2, ShieldCheck } from "lucide-react"
import { Page, EmptyState } from "@/components/ui/page"
import { Card } from "@/components/ui/card"
import Button from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Input from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import Modal from "@/components/ui/modal"
import { invoke } from "@/lib/ipc"
import { formatDate } from "@/lib/utils"
import type { RestorePoint } from "../../../types"

export default function Backup(): React.ReactNode {
  const [points, setPoints] = useState<RestorePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<RestorePoint | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await invoke<{ success: boolean; points?: RestorePoint[]; error?: string }>(
        "get-restore-points",
      )
      setPoints(result?.points ?? [])
    } catch {
      toast.error("Could not read restore points.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async (custom?: string): Promise<void> => {
    setCreating(true)
    setCreateOpen(false)
    try {
      const result = await invoke<{ success: boolean; label?: string; error?: string }>(
        custom ? "create-restore-point" : "create-sparkle-restore-point",
        custom,
      )
      if (result?.success) {
        toast.success(`Restore point “${result.label}” created.`)
        load()
      } else {
        toast.error(result?.error ?? "System Protection may be disabled on this drive.")
      }
    } catch {
      toast.error("Failed to create a restore point.")
    } finally {
      setCreating(false)
      setName("")
    }
  }

  const restore = async (): Promise<void> => {
    if (!restoreTarget) return
    const target = restoreTarget
    setRestoreTarget(null)
    toast.info("Restoring… Windows will restart when ready.")
    await invoke("restore-restore-point", target.SequenceNumber).catch(() =>
      toast.error("Restore failed."),
    )
  }

  const deleteAll = async (): Promise<void> => {
    setDeleteOpen(false)
    await invoke("delete-all-restore-points").catch(() => undefined)
    await invoke("delete-old-sparkle-backups").catch(() => undefined)
    toast.success("All restore points removed.")
    load()
  }

  return (
    <Page
      title="Backup"
      description="System restore points created by Windows and Sparkle."
      icon={<Archive className="size-5" />}
      actions={
        <>
          <Button variant="ghost" icon={<RefreshCw className="size-4" />} onClick={load}>
            Refresh
          </Button>
          <Button variant="ghost" onClick={() => setCreateOpen(true)}>
            Custom name
          </Button>
          <Button
            variant="primary"
            loading={creating}
            icon={<Plus className="size-4" />}
            onClick={() => create()}
          >
            Create restore point
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-success/12 text-success">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">Safety first</p>
              <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted">
                A restore point lets Windows roll back registry and system file changes. Create one
                before applying risky tweaks or uninstalling system components.
              </p>
            </div>
          </div>
          {points.length > 0 && (
            <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setDeleteOpen(true)}>
              Delete all
            </Button>
          )}
        </Card>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && points.length === 0 && (
          <EmptyState
            icon={<Archive className="size-5" />}
            title="No restore points yet"
            description="Create your first snapshot so you can always roll back."
            action={
              <Button variant="primary" size="sm" onClick={() => create()}>
                Create restore point
              </Button>
            }
          />
        )}

        {!loading &&
          points.map((point) => (
            <Card key={point.SequenceNumber} hover className="flex items-center gap-4 p-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 font-mono text-xs text-primary">
                #{point.SequenceNumber}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-fg">{point.Description}</p>
                  {String(point.Description).startsWith("Sparkle") && (
                    <Badge tone="primary">Sparkle</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted">{formatDate(point.CreationTime)}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={<RotateCcw className="size-3.5" />}
                onClick={() => setRestoreTarget(point)}
              >
                Restore
              </Button>
            </Card>
          ))}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        size="sm"
        icon={<Plus className="size-5" />}
        title="Name your restore point"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => create(name || "ManualRestore")}>
              Create
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Before gaming tweaks"
        />
      </Modal>

      <Modal
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        size="sm"
        icon={<RotateCcw className="size-5 text-warning" />}
        title="Restore this snapshot?"
        description={restoreTarget?.Description}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRestoreTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={restore}>
              Restore & restart
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed">
          Windows will reboot and roll back system files, drivers and registry settings to{" "}
          <span className="text-fg">{formatDate(restoreTarget?.CreationTime)}</span>. Personal files
          are not affected.
        </p>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        size="sm"
        icon={<Trash2 className="size-5 text-danger" />}
        title="Delete every restore point?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={deleteAll}>
              Delete all
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed">
          Shadow copies for all drives will be removed. You will not be able to roll Windows back
          until a new restore point is created.
        </p>
      </Modal>
    </Page>
  )
}
