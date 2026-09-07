import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Loader2 } from 'lucide-react'
import { useI18n } from '../../i18n'
import { cn } from '../../lib/utils'

interface ReasoningPanelProps {
  thinking?: string
  isStreaming: boolean
}

/**
 * Pensamiento visible profesional (§13): spinner + "Pensando…" durante
 * generación; al terminar, disclosure colapsado con duración real.
 * Nunca se mezcla con el contenido final.
 */
export default function ReasoningPanel({ thinking, isStreaming }: ReasoningPanelProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const startRef = useRef<number | null>(null)
  const wasStreaming = useRef(isStreaming)

  useEffect(() => {
    if (thinking && startRef.current === null) startRef.current = Date.now()
  }, [thinking])

  useEffect(() => {
    if (isStreaming && !wasStreaming.current) {
      startRef.current = thinking ? startRef.current : null
      setElapsed(null)
      setOpen(true)
    }
    if (!isStreaming && wasStreaming.current) {
      if (startRef.current !== null) {
        setElapsed(Math.max(0, Math.round((Date.now() - startRef.current) / 1000)))
      }
      setOpen(false)
      startRef.current = null
    }
    wasStreaming.current = isStreaming
  }, [isStreaming, thinking])

  if (!thinking && !isStreaming) return null

  return (
    <div className="mb-2">
      {isStreaming && !thinking ? (
        <p role="status" className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
          <Loader2 size={14} className="animate-spin text-[var(--accent-2)]" aria-hidden="true" />
          {t('reasoning.thinking')}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-[13px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
          >
            {isStreaming ? (
              <Loader2
                size={13}
                className="animate-spin text-[var(--accent-2)]"
                aria-hidden="true"
              />
            ) : (
              <ChevronRight
                size={14}
                aria-hidden="true"
                className={cn('transition-transform', open && 'rotate-90')}
              />
            )}
            {isStreaming ? t('reasoning.thinking') : t('reasoning.title')}
            {!isStreaming && elapsed !== null && (
              <span className="text-[var(--text-subtle)]">
                · {t('reasoning.time', { s: elapsed })}
              </span>
            )}
          </button>
          {open && thinking && (
            <div className="mt-1 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent-2)]/60 bg-[var(--bg-subtle)] px-3 py-2">
              <pre className="max-h-48 overflow-y-auto font-sans text-[13px] leading-relaxed whitespace-pre-wrap text-[var(--text-muted)]">
                {thinking}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  )
}
