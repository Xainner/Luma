import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '../i18n'

export interface PaletteItem {
  key: string
  label: string
  hint?: string
  icon?: LucideIcon
  onSelect: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  items: PaletteItem[]
}

export default function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const { t } = useI18n()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/70 px-4 pt-24 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={t('palette.title')}
          >
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <span className="font-display text-sm font-bold text-mist-100">{t('palette.title')}</span>
              <span className="text-xs text-mist-600">{t('palette.close')}</span>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {items.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => {
                      item.onSelect()
                      onClose()
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-mist-200 transition-colors hover:bg-white/5 hover:text-mist-100"
                  >
                    {item.icon && <item.icon size={16} className="shrink-0 text-nebula-300" />}
                    <span className="flex-1">{item.label}</span>
                    {item.hint && <span className="text-xs text-mist-600">{item.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
