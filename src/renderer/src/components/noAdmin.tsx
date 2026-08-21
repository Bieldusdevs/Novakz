import { ShieldAlert } from "lucide-react"
import Modal from "@/components/ui/modal"
import Button from "@/components/ui/button"

interface Props {
  open: boolean
  onClose: () => void
}

export default function NoAdmin({ open, onClose }: Props): React.ReactNode {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      icon={<ShieldAlert className="size-5 text-warning" />}
      title="Administrator rights required"
      description="Sparkle is running without elevation."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Continue anyway
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Understood
          </Button>
        </>
      }
    >
      <p className="leading-relaxed">
        Most tweaks, cleanup routines and restore points need administrator privileges. Close
        Sparkle and relaunch it with <span className="text-fg">“Run as administrator”</span> to
        unlock every feature.
      </p>
    </Modal>
  )
}
