import { useEffect, useState, type ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Rocket, ExternalLink } from "lucide-react"
import Modal from "@/components/ui/modal"
import Button from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GITHUB_REPO, CURRENT_VERSION } from "@/lib/version"
import { openExternal } from "@/lib/ipc"
import { formatDate } from "@/lib/utils"

interface Release {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
}

type CodeProps = ComponentProps<"code"> & { inline?: boolean }

function ChangelogContent({ body }: { body: string }): React.ReactNode {
  return (
    <div className="prose prose-sm max-w-none text-muted prose-headings:text-fg prose-headings:font-semibold prose-strong:text-fg prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:rounded-md prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.8em] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-line prose-pre:bg-surface-2 prose-li:marker:text-primary prose-img:rounded-xl prose-img:border prose-img:border-line prose-hr:border-line">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ href, children, ...props }) => (
            <a
              {...props}
              href={href}
              onClick={(e) => {
                e.preventDefault()
                if (href) openExternal(href)
              }}
            >
              {children}
            </a>
          ),
          img: ({ ...props }) => <img {...props} loading="lazy" />,
          code: ({ inline, className, children, ...props }: CodeProps) => (
            <code className={className} {...props}>
              {children}
            </code>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}

export default function ChangelogModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}): React.ReactNode {
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setFailed(false)
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("request failed"))))
      .then((data: Release) => {
        if (!cancelled) setRelease(data)
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<Rocket className="size-5" />}
      title={`What's new in Sparkle ${release?.tag_name ?? `v${CURRENT_VERSION}`}`}
      description={
        release ? `Released ${formatDate(release.published_at)}` : "Fetching the latest release notes"
      }
      footer={
        <>
          {release && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ExternalLink className="size-3.5" />}
              onClick={() => openExternal(release.html_url)}
            >
              View on GitHub
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onClose}>
            Got it
          </Button>
        </>
      }
    >
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      )}
      {!loading && failed && (
        <p className="text-xs leading-relaxed">
          Couldn’t reach GitHub right now. You’re running{" "}
          <span className="text-fg">v{CURRENT_VERSION}</span> — check the releases page later for the
          full changelog.
        </p>
      )}
      {!loading && release && <ChangelogContent body={release.body || "No notes provided."} />}
    </Modal>
  )
}
