import { ArrowDown } from 'lucide-react'
import { useI18n } from '../../i18n'

interface ScrollToBottomProps {
  visible: boolean
  onClick: () => void
}

/** Botón flotante ↓ sobre el composer cuando el usuario sube durante streaming (§14). */
export default function ScrollToBottom({ visible, onClick }: ScrollToBottomProps) {
  const { t } = useI18n()
  if (!visible) return null
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('scroll.bottom')}
      title={t('scroll.bottom')}
      className="absolute bottom-24 left-1/2 z-10 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all hover:text-[var(--text)] active:scale-95"
    >
      <ArrowDown size={17} />
    </button>
  )
}
