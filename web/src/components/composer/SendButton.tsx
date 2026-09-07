import { ArrowUp, Square } from 'lucide-react'
import { useI18n } from '../../i18n'

interface SendButtonProps {
  isStreaming: boolean
  disabled: boolean
  onSend: () => void
  onStop: () => void
}

/** Un solo botón circular que muta Send ↔ Stop (§8.7). */
export default function SendButton({ isStreaming, disabled, onSend, onStop }: SendButtonProps) {
  const { t } = useI18n()
  if (isStreaming) {
    return (
      <button
        type="button"
        onClick={onStop}
        aria-label={t('composer.stop')}
        title={t('composer.stop')}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--danger)] text-white transition-all hover:brightness-110 active:scale-95"
      >
        <Square size={14} fill="currentColor" />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onSend}
      aria-label={t('composer.send')}
      title="Enter"
      disabled={disabled}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-subtle)]"
    >
      <ArrowUp size={17} />
    </button>
  )
}
