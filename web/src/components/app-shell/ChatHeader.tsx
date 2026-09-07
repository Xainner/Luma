import { Menu, PanelLeft } from 'lucide-react'
import { useI18n } from '../../i18n'
import ChatRowMenu, { type ExportFormat } from './ChatRowMenu'

interface ChatHeaderProps {
  /** null = chat nuevo (sin título ni menú). */
  title: string | null
  onOpenMobileSidebar: () => void
  onExpandSidebar: () => void
  sidebarCollapsed: boolean
  onRename: (title: string) => void
  onExport: (format: ExportFormat) => void
  onDelete: () => void
}

/** Header mínimo y contextual (§6): toggles + título con tooltip + menú •••. */
export default function ChatHeader({
  title,
  onOpenMobileSidebar,
  onExpandSidebar,
  sidebarCollapsed,
  onRename,
  onExport,
  onDelete,
}: ChatHeaderProps) {
  const { t } = useI18n()
  return (
    <header className="flex h-13 shrink-0 items-center gap-2 border-b border-[var(--border)] px-3">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        aria-label={t('chat.openMenu')}
        className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)] lg:hidden"
      >
        <Menu size={19} />
      </button>
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={onExpandSidebar}
          aria-label={t('shell.expand')}
          title={t('shell.expand')}
          className="hidden rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)] lg:block"
        >
          <PanelLeft size={18} />
        </button>
      )}
      {title && (
        <>
          <p
            title={title}
            className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text)]"
          >
            {title}
          </p>
          <ChatRowMenu title={title} onRename={onRename} onExport={onExport} onDelete={onDelete} />
        </>
      )}
    </header>
  )
}
