import type { ReactNode } from 'react'
import {
  ArrowLeft,
  BrainCircuit,
  ChevronRight,
  Cpu,
  Database,
  Info,
  Keyboard,
  Palette,
  Paperclip,
  Plug,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react'
import type { User } from '../../types'
import { useI18n } from '../../i18n'
import { useUIStore, type SettingsSection } from '../../stores/ui'

const NAV: Array<{ id: SettingsSection; icon: typeof Info; adminOnly?: boolean }> = [
  { id: 'general', icon: SlidersHorizontal },
  { id: 'appearance', icon: Palette },
  { id: 'connection', icon: Plug },
  { id: 'models', icon: Cpu },
  { id: 'reasoning', icon: BrainCircuit },
  { id: 'profiles', icon: UserRound },
  { id: 'attachments', icon: Paperclip },
  { id: 'shortcuts', icon: Keyboard },
  { id: 'data', icon: Database },
  { id: 'admin', icon: ShieldCheck, adminOnly: true },
  { id: 'about', icon: Info },
]

/** Shell de ajustes (§18): nav por categorías en desktop, lista→subvista en móvil. */
export default function SettingsShell({
  user,
  isAdmin,
  onBack,
  children,
}: {
  user: User
  isAdmin: boolean
  onBack: () => void
  children: ReactNode
}) {
  const { t } = useI18n()
  const section = useUIStore((s) => s.settingsSection)
  const setSection = useUIStore((s) => s.setSettingsSection)

  const items = NAV.filter((n) => !n.adminOnly || isAdmin)
  const sectionTitle = t(`settings.nav.${section}`)

  const navList = (
    <nav aria-label={t('settings.title')} className="space-y-0.5">
      {items.map(({ id, icon: Icon }) => {
        const active = section === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors ${
              active
                ? 'bg-[var(--accent)]/12 text-[var(--text)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]'
            }`}
          >
            <Icon size={16} aria-hidden="true" className={active ? 'text-[var(--accent-2)]' : ''} />
            <span className="flex-1 text-left">{t(`settings.nav.${id}`)}</span>
            <ChevronRight
              size={14}
              aria-hidden="true"
              className="text-[var(--text-subtle)] md:hidden"
            />
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border)] px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('settings.back')}
          className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-base font-bold tracking-tight text-[var(--text)]">
          {t('settings.title')}
          <span className="ml-2 font-sans text-sm font-medium text-[var(--text-subtle)] md:hidden">
            · {sectionTitle}
          </span>
        </h1>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="hidden max-w-[160px] truncate sm:inline">{user.email}</span>
          <span
            className={`rounded-lg px-2 py-0.5 font-semibold ${
              isAdmin
                ? 'bg-[var(--accent)]/15 text-[var(--accent-2)]'
                : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
            }`}
          >
            {isAdmin ? t('settings.badgeAdmin') : t('settings.badgeUser')}
          </span>
        </span>
      </header>

      {/* Móvil: chips horizontales. Desktop: nav lateral + contenido. */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="shrink-0 border-b border-[var(--border)] p-2 md:hidden">
          <nav aria-label={t('settings.title')} className="flex gap-1.5 overflow-x-auto pb-1">
            {items.map(({ id, icon: Icon }) => {
              const active = section === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[var(--accent)]/12 text-[var(--text)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon
                    size={15}
                    aria-hidden="true"
                    className={active ? 'text-[var(--accent-2)]' : ''}
                  />
                  {t(`settings.nav.${id}`)}
                </button>
              )
            })}
          </nav>
        </div>
        <aside className="hidden w-55 shrink-0 overflow-y-auto border-r border-[var(--border)] p-3 md:block">
          {navList}
        </aside>
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
