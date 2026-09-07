import { MessageSquare, PanelLeftClose, Plus, Search, Settings2 } from 'lucide-react'
import type { ChatMeta, Language, User } from '../../types'
import type { Theme } from '../../lib/theme'
import { groupChatsByDate } from '../../lib/chat-groups'
import { useI18n } from '../../i18n'
import { cn } from '../../lib/utils'
import Logo from '../Logo'
import UserMenu from './UserMenu'
import ChatRowMenu, { type ExportFormat } from './ChatRowMenu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface AppSidebarProps {
  chats: ChatMeta[]
  activeId: string | null
  user: User
  theme: Theme
  lang: Language
  collapsed: boolean
  onToggleCollapse: () => void
  onSearch: () => void
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onRenameChat: (id: string, title: string) => void
  onExportChat: (id: string, format: ExportFormat) => void
  onDeleteChat: (id: string) => void
  onOpenSettings: () => void
  onLogout: () => void
  onThemeChange: (theme: Theme) => void
  onLanguageChange: (lang: Language) => void
}

function RailButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="flex size-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

/** Sidebar v2: solo navegación e historial. Sin modelo/perfil/thinking (viven en el composer). */
export default function AppSidebar({
  chats,
  activeId,
  user,
  theme,
  lang,
  collapsed,
  onToggleCollapse,
  onSearch,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onExportChat,
  onDeleteChat,
  onOpenSettings,
  onLogout,
  onThemeChange,
  onLanguageChange,
}: AppSidebarProps) {
  const { t } = useI18n()

  if (collapsed) {
    return (
      <div className="flex h-full w-full flex-col items-center gap-1 py-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={t('shell.expand')}
          title={t('shell.expand')}
        >
          <Logo size={36} />
        </button>
        <div className="mt-3 flex flex-col gap-1">
          <RailButton label={t('sidebar.newChat')} onClick={onNewChat}>
            <Plus size={19} />
          </RailButton>
          <RailButton label={t('cmd.searchChats')} onClick={onSearch}>
            <Search size={18} />
          </RailButton>
          <RailButton label={t('nav.chats')} onClick={onToggleCollapse}>
            <MessageSquare size={18} />
          </RailButton>
        </div>
        <div className="mt-auto flex flex-col items-center gap-1">
          <RailButton label={t('nav.settings')} onClick={onOpenSettings}>
            <Settings2 size={18} />
          </RailButton>
          <UserMenu
            user={user}
            theme={theme}
            lang={lang}
            onOpenSettings={onOpenSettings}
            onThemeChange={onThemeChange}
            onLanguageChange={onLanguageChange}
            onLogout={onLogout}
            trigger={
              <button
                type="button"
                aria-label={t('usermenu.account')}
                className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent)]/80 text-sm font-bold text-white transition-transform hover:scale-105"
              >
                {user.email[0].toUpperCase()}
              </button>
            }
          />
        </div>
      </div>
    )
  }

  const groups = groupChatsByDate(chats)

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <Logo size={36} />
          <span className="text-[17px] font-bold tracking-tight text-[var(--text)]">Luma</span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={t('shell.collapse')}
          title={t('shell.collapse')}
          className="hidden rounded-lg p-2 text-[var(--text-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)] lg:block"
        >
          <PanelLeftClose size={17} />
        </button>
      </div>

      <div className="space-y-1.5 px-3 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:border-[var(--accent)]/50 active:scale-[0.98]"
        >
          <Plus size={17} className="text-[var(--accent-2)]" />
          {t('sidebar.newChat')}
        </button>
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          <Search size={15} />
          {t('cmd.searchChats')}
        </button>
      </div>

      <nav aria-label={t('nav.chats')} className="px-3 pb-1">
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          <Settings2 size={15} />
          {t('nav.settings')}
        </button>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1">
        {groups.length === 0 && (
          <p className="px-2 py-6 text-center text-sm whitespace-pre-line text-[var(--text-subtle)]">
            {t('sidebar.noChats')}
          </p>
        )}
        {groups.map((g) => (
          <div key={g.key} className="mb-3">
            <p className="mb-1 px-2 text-[11px] font-semibold tracking-widest text-[var(--text-subtle)] uppercase">
              {t(`groups.${g.key}`)}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((chat) => {
                const active = chat.id === activeId
                return (
                  <li key={chat.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onSelectChat(chat.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl py-2 pr-9 pl-2.5 text-left transition-colors',
                        active ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]/60',
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-[var(--accent)]"
                        />
                      )}
                      <span
                        className={cn(
                          'block min-w-0 flex-1 truncate text-sm',
                          active ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]',
                        )}
                      >
                        {chat.title || t('sidebar.newChat')}
                      </span>
                    </button>
                    <span className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <ChatRowMenu
                        title={chat.title || t('sidebar.newChat')}
                        onRename={(title) => onRenameChat(chat.id, title)}
                        onExport={(format) => onExportChat(chat.id, format)}
                        onDelete={() => onDeleteChat(chat.id)}
                      />
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--border)] p-3">
        <UserMenu
          user={user}
          theme={theme}
          lang={lang}
          onOpenSettings={onOpenSettings}
          onThemeChange={onThemeChange}
          onLanguageChange={onLanguageChange}
          onLogout={onLogout}
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--bg-hover)]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/80 text-sm font-bold text-white">
                {user.email[0].toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--text)]">
                  {user.email}
                </span>
                <span className="block text-[11px] text-[var(--text-subtle)]">
                  {user.role === 'admin' ? t('sidebar.admin') : t('sidebar.user')}
                </span>
              </span>
            </button>
          }
        />
      </div>
    </div>
  )
}
