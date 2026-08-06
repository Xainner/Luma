import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, MessageSquare, Plus, Settings2, Trash2, X } from 'lucide-react'
import type { ChatMeta, Language, Profile, User } from '../types'
import { useI18n } from '../i18n'
import { labelClass } from '../lib/ui'
import Logo from './Logo'

interface SidebarProps {
  chats: ChatMeta[]
  activeId: string | null
  open: boolean
  user: User
  onClose: () => void
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onOpenSettings: () => void
  onLogout: () => void
  models: string[]
  model: string
  onModelChange: (model: string) => void
  profiles: Profile[]
  profileId: string
  onProfileChange: (id: string) => void
}

function timeAgo(ts: number, lang: Language): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  const fmt = (unit: Intl.RelativeTimeFormatUnit, value: number) =>
    new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' }).format(value, unit)
  if (s < 60) return fmt('second', 0)
  const m = Math.round(s / 60)
  if (m < 60) return fmt('minute', -m)
  const h = Math.round(m / 60)
  if (h < 24) return fmt('hour', -h)
  const d = Math.round(h / 24)
  if (d < 7) return fmt('day', -d)
  return new Date(ts).toLocaleDateString(lang, { day: 'numeric', month: 'short' })
}

export default function Sidebar({
  chats,
  activeId,
  open,
  user,
  onClose,
  onSelect,
  onNew,
  onDelete,
  onOpenSettings,
  onLogout,
  models,
  model,
  onModelChange,
  profiles,
  profileId,
  onProfileChange,
}: SidebarProps) {
  const { t, lang } = useI18n()

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-white/8 bg-ink-900/95 backdrop-blur-xl transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? 'visible translate-x-0' : 'invisible -translate-x-full'
        } lg:visible`}
        aria-label={t('sidebar.chats')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="font-display text-lg font-bold tracking-tight text-mist-100">Luma</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('sidebar.closeMenu')}
            className="rounded-lg p-2 text-mist-500 transition-colors hover:bg-white/5 hover:text-mist-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={onNew}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-mist-100 transition-all hover:border-nebula-400/50 hover:bg-white/10 active:scale-[0.98]"
          >
            <Plus size={17} className="text-nebula-300 transition-transform group-hover:rotate-90" />
            {t('sidebar.newChat')}
          </button>
        </div>

        {/* Chats */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-mist-600">
            {t('sidebar.chats')}
          </p>
          {chats.length === 0 && (
            <p className="px-2 py-6 text-center text-sm whitespace-pre-line text-mist-600">
              {t('sidebar.noChats')}
            </p>
          )}
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {chats.map((chat) => (
                <motion.li
                  key={chat.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="group relative"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(chat.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 pr-10 text-left transition-colors ${
                      chat.id === activeId
                        ? 'border border-iris-500/40 bg-iris-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                        : 'border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <MessageSquare
                      size={16}
                      className={`shrink-0 ${
                        chat.id === activeId ? 'text-iris-400' : 'text-mist-600'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm ${
                          chat.id === activeId ? 'font-semibold text-mist-100' : 'text-mist-400'
                        }`}
                      >
                        {chat.title || t('sidebar.newChat')}
                      </span>
                      <span className="block text-[11px] text-mist-600">
                        {timeAgo(chat.updatedAt, lang)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t('sidebar.deleteChat', { title: chat.title || t('sidebar.newChat') })}
                    onClick={() => onDelete(chat.id)}
                    className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg p-1.5 text-mist-600 opacity-0 transition-all hover:bg-red-500/15 hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 p-3">
          <label htmlFor="sidebar-profile" className={labelClass}>
            {t('sidebar.profile')}
          </label>
          <select
            id="sidebar-profile"
            value={profileId}
            onChange={(e) => onProfileChange(e.target.value)}
            className="mb-2 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 text-sm text-mist-100 transition-colors focus:border-nebula-400/60 focus:outline-none"
          >
            <option value="">{t('sidebar.noProfile')}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>

          <label htmlFor="sidebar-model" className={labelClass}>
            {t('sidebar.model')}
          </label>
          <select
            id="sidebar-model"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="mb-2 w-full rounded-xl border border-white/10 bg-ink-850 px-3 py-2 text-sm text-mist-100 transition-colors focus:border-nebula-400/60 focus:outline-none"
          >
            {models.length === 0 && <option value="">{t('sidebar.noModels')}</option>}
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100"
          >
            <Settings2 size={17} />
            {t('sidebar.settings')}
          </button>

          <div className="mt-2 flex items-center gap-2.5 rounded-xl border-t border-white/8 pt-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nebula-500/70 to-iris-600/70 text-sm font-bold text-white">
              {user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-mist-100">{user.email}</p>
              <p className="text-[11px] text-mist-600">
                {user.role === 'admin' ? t('sidebar.admin') : t('sidebar.user')}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label={t('sidebar.logout')}
              title={t('sidebar.logout')}
              className="rounded-lg p-2 text-mist-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
