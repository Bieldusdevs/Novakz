import { useEffect, useState } from "react"
import { Sparkles, Gauge, ShieldCheck, Rocket, ArrowRight } from "lucide-react"
import Modal from "@/components/ui/modal"
import Button from "@/components/ui/button"
import { CURRENT_VERSION } from "@/lib/version"

const STORAGE_KEY = "sparkle:onboarded"

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to Sparkle",
    body: "A modern control center for Windows performance, privacy and cleanup — all in one place.",
  },
  {
    icon: Gauge,
    title: "Tweak with confidence",
    body: "Every tweak is documented, categorized and reversible whenever Windows allows it. Filter by risk level before applying.",
  },
  {
    icon: ShieldCheck,
    title: "Stay safe",
    body: "Sparkle can create a system restore point in one click. We recommend doing that before your first batch of tweaks.",
  },
  {
    icon: Rocket,
    title: "You're ready",
    body: "Head to the dashboard to see your hardware and jump straight into the recommended optimizations.",
  },
]

export default function FirstTime(): React.ReactNode {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== CURRENT_VERSION) {
      const timer = setTimeout(() => setOpen(true), 250)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [])

  const finish = (): void => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)
    setOpen(false)
  }

  const current = steps[step]
  const Icon = current.icon
  const last = step === steps.length - 1

  return (
    <Modal open={open} onClose={finish} size="sm" hideClose>
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <div className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-primary via-accent to-accent-2 text-white shadow-[0_20px_50px_-20px_var(--primary)]">
          <Icon className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-fg">{current.title}</h2>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted">{current.body}</p>
        </div>

        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-line-strong"
              }`}
            />
          ))}
        </div>

        <div className="flex w-full items-center justify-between gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight className="size-4" />}
            onClick={() => (last ? finish() : setStep((s) => s + 1))}
          >
            {last ? "Get started" : "Next"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
