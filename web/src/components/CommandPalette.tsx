import { useEffect, useMemo, useState } from 'react'
import { Command } from 'cmdk'
import {
  ArrowLeft,
  Box,
  BrainCircuit,
  Download,
  Languages,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  Plus,
  Settings2,
  Sparkles,
  Sun,
} from 'lucide-react'
import type { ChatMeta, Language, Profile, ThoughtEffort } from '../types'
import type { Theme } from '../lib/theme'
import { listChats } from '../lib/api'
import { useI18n } from '../i18n'
import type { ExportFormat } from './app-shell/ChatRowMenu'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  chats: ChatMeta[]
  activeId: string | null
  models: string[]
  currentModel: string
  profiles: Profile[]
  currentProfileId: string
  thinkingEffort: ThoughtEffort
  thinkingModel: string
  theme: Theme
  lang: Language
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onOpenSettings: () => void
  onModelChange: (model: string) => void
  onProfileChange: (id: string) => void
  onThinkingChange: (effort: ThoughtEffort) => void
  onExportChat: (format: ExportFormat) => void
  onThemeChange: (theme: Theme) => void
  onLanguageChange: (lang: Language) => void
  onLogout: () => void
}

type Page = 'root' | 'models' | 'profiles' | 'thinking' | 'themes'

const THINKING_LEVELS: ThoughtEffort[] = ['off', 'low', 'medium', 'high']

/** Paleta v2 (§17): acciones + conversaciones con búsqueda + subpáginas. */
export default function CommandPalette({
  open,
  onClose,
  chats,
  activeId,
  models,
  currentModel,
  profiles,
  currentProfileId,
  thinkingEffort,
  thinkingModel,
  theme,
  lang,
  onSelectChat,
  onNewChat,
  onOpenSettings,
  onModelChange,
  onProfileChange,
  onThinkingChange,
  onExportChat,
  onThemeChange,
  onLanguageChange,
  onLogout,
}: CommandPaletteProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState<Page>('root')
  const [results, setResults] = useState<ChatMeta[] | null>(null)

  useEffect(() => {
    if (!open || !query.trim()) return
    const timer = setTimeout(async () => {
      try {
        setResults(await listChats(query.trim()))
      } catch {
        setResults([])
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query, open])

  function handleOpenChange(v: boolean) {
    if (!v) {
      setQuery('')
      setPage('root')
      setResults(null)
      onClose()
    }
  }

  function handleQueryChange(v: string) {
    setQuery(v)
    if (!v.trim()) setResults(null)
  }

  function run(fn: () => void) {
    fn()
    onClose()
  }

  const conversations = useMemo(() => {
    if (results) return results
    if (!query.trim()) return chats.slice(0, 6)
    return []
  }, [results, chats, query])

  const itemClass =
    'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 text-sm text-[var(--text)] select-none aria-selected:bg-[var(--bg-hover)] [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-[var(--text-muted)]'

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      label={t('cmd.placeholder')}
      shouldFilter={page === 'root'}
      className="fixed top-1/2 left-1/2 z-[100] max-h-[70vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_8px_30px_rgba(0,0,0,0.24)] outline-none"
      overlayClassName="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
        {page !== 'root' && (
          <button
            type="button"
            aria-label={t('deleteChat.cancel')}
            onClick={() => setPage('root')}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <Command.Input
          value={query}
          onValueChange={handleQueryChange}
          placeholder={t('cmd.placeholder')}
          className="h-12 w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)]"
        />
      </div>
      <Command.List className="max-h-[50vh] overflow-y-auto p-1.5">
        <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--text-subtle)]">
          {t('cmd.noResults')}
        </Command.Empty>

        {page === 'root' && (
          <>
            <Command.Group
              heading={t('cmd.actions')}
              className="px-2 py-1.5 text-[11px] font-semibold tracking-widest text-[var(--text-subtle)] uppercase [&_[cmdk-group-heading]]:px-1"
            >
              <Command.Item
                value={t('sidebar.newChat')}
                onSelect={() => run(onNewChat)}
                className={itemClass}
              >
                <Plus />
                {t('sidebar.newChat')}
              </Command.Item>
              <Command.Item
                value={t('cmd.changeModel')}
                onSelect={() => setPage('models')}
                className={itemClass}
              >
                <Box />
                {t('cmd.changeModel')}
              </Command.Item>
              <Command.Item
                value={t('cmd.changeProfile')}
                onSelect={() => setPage('profiles')}
                className={itemClass}
              >
                <Sparkles />
                {t('cmd.changeProfile')}
              </Command.Item>
              <Command.Item
                value={t('cmd.changeThinking')}
                onSelect={() => setPage('thinking')}
                className={itemClass}
              >
                <BrainCircuit />
                {t('cmd.changeThinking')}
              </Command.Item>
              <Command.Item
                value={t('usermenu.settings')}
                onSelect={() => run(onOpenSettings)}
                className={itemClass}
              >
                <Settings2 />
                {t('usermenu.settings')}
              </Command.Item>
              <Command.Item
                value={t('export.menu')}
                onSelect={() => run(() => onExportChat('md'))}
                className={itemClass}
              >
                <Download />
                {t('export.menu')}
              </Command.Item>
              <Command.Item
                value={t('cmd.changeTheme')}
                onSelect={() => setPage('themes')}
                className={itemClass}
              >
                <Monitor />
                {t('cmd.changeTheme')}
              </Command.Item>
              <Command.Item
                value={t('cmd.changeLanguage')}
                onSelect={() => run(() => onLanguageChange(lang === 'es' ? 'en' : 'es'))}
                className={itemClass}
              >
                <Languages />
                {lang === 'es' ? 'English' : 'Español'}
              </Command.Item>
              <Command.Item
                value={t('usermenu.logout')}
                onSelect={() => run(onLogout)}
                className={itemClass}
              >
                <LogOut />
                {t('usermenu.logout')}
              </Command.Item>
            </Command.Group>
            {conversations.length > 0 && (
              <Command.Group
                heading={t('cmd.chats')}
                className="px-2 py-1.5 text-[11px] font-semibold tracking-widest text-[var(--text-subtle)] uppercase [&_[cmdk-group-heading]]:px-1"
              >
                {conversations.map((c) => (
                  <Command.Item
                    key={c.id}
                    value={c.title || t('sidebar.newChat')}
                    onSelect={() => run(() => onSelectChat(c.id))}
                    className={itemClass}
                  >
                    <MessageSquare />
                    <span className="truncate">{c.title || t('sidebar.newChat')}</span>
                    {c.id === activeId && (
                      <span className="ml-auto text-[11px] text-[var(--accent-2)]">●</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </>
        )}

        {page === 'models' && (
          <Command.Group
            heading={t('cmd.models')}
            className="px-2 py-1.5 text-[11px] font-semibold tracking-widest text-[var(--text-subtle)] uppercase [&_[cmdk-group-heading]]:px-1"
          >
            {models.length === 0 && (
              <Command.Item value="" disabled className={itemClass}>
                {t('sidebar.noModels')}
              </Command.Item>
            )}
            {models.map((m) => (
              <Command.Item
                key={m}
                value={m}
                onSelect={() => run(() => onModelChange(m))}
                className={itemClass}
              >
                <Box />
                <span className="truncate font-mono text-[13px]">{m}</span>
                {m === currentModel && <span className="ml-auto text-[var(--accent-2)]">✓</span>}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {page === 'profiles' && (
          <Command.Group
            heading={t('cmd.profiles')}
            className="px-2 py-1.5 text-[11px] font-semibold tracking-widest text-[var(--text-subtle)] uppercase [&_[cmdk-group-heading]]:px-1"
          >
            <Command.Item
              value={t('composer.noProfile')}
              onSelect={() => run(() => onProfileChange(''))}
              className={itemClass}
            >
              <Sparkles />
              {t('composer.noProfile')}
              {currentProfileId === '' && <span className="ml-auto text-[var(--accent-2)]">✓</span>}
            </Command.Item>
            {profiles.map((p) => (
              <Command.Item
                key={p.id}
                value={p.name}
                keywords={[p.name]}
                onSelect={() => run(() => onProfileChange(p.id))}
                className={itemClass}
              >
                <span aria-hidden="true">{p.emoji}</span>
                {p.name}
                {p.id === currentProfileId && (
                  <span className="ml-auto text-[var(--accent-2)]">✓</span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {page === 'thinking' && (
          <Command.Group
            heading={`${t('composer.thinkingLabel')} · ${thinkingModel}`}
            className="px-2 py-1.5 text-[11px] font-semibold tracking-widest text-[var(--text-subtle)] uppercase [&_[cmdk-group-heading]]:px-1"
          >
            {THINKING_LEVELS.map((level) => (
              <Command.Item
                key={level}
                value={t(`thinking.${level}`)}
                onSelect={() => run(() => onThinkingChange(level))}
                className={itemClass}
              >
                <BrainCircuit />
                {t(`thinking.${level}`)}
                {level === thinkingEffort && (
                  <span className="ml-auto text-[var(--accent-2)]">✓</span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {page === 'themes' && (
          <Command.Group
            heading={t('usermenu.theme')}
            className="px-2 py-1.5 text-[11px] font-semibold tracking-widest text-[var(--text-subtle)] uppercase [&_[cmdk-group-heading]]:px-1"
          >
            {(['system', 'light', 'dark'] as const).map((th) => {
              const Icon = th === 'system' ? Monitor : th === 'light' ? Sun : Moon
              return (
                <Command.Item
                  key={th}
                  value={t(`theme.${th}`)}
                  onSelect={() => run(() => onThemeChange(th))}
                  className={itemClass}
                >
                  <Icon />
                  {t(`theme.${th}`)}
                  {th === theme && <span className="ml-auto text-[var(--accent-2)]">✓</span>}
                </Command.Item>
              )
            })}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  )
}
