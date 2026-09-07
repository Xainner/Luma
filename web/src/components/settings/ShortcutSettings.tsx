import { useI18n } from '../../i18n'
import { Section } from './parts'

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text)]">
      {children}
    </kbd>
  )
}

/** Settings > Atajos (§26): tabla sencilla + prioridad de Escape. */
export default function ShortcutSettings() {
  const { t } = useI18n()
  const rows: Array<[string, string[]]> = [
    [t('settings.shortcuts.new'), ['Ctrl/⌘', 'N']],
    [t('settings.shortcuts.palette'), ['Ctrl/⌘', 'K']],
    [t('settings.shortcuts.sidebar'), ['Ctrl/⌘', 'Shift', 'O']],
    [t('settings.shortcuts.focus'), ['/']],
    [t('settings.shortcuts.send'), ['Enter']],
    [t('settings.shortcuts.newline'), ['Shift', 'Enter']],
    [t('settings.shortcuts.close'), ['Esc']],
  ]
  return (
    <div className="space-y-6">
      <Section title={t('settings.nav.shortcuts')} desc={t('settings.shortcuts.subtitle')}>
        <ul className="divide-y divide-[var(--border)]">
          {rows.map(([label, keys]) => (
            <li key={label} className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-sm text-[var(--text-muted)]">{label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--text-subtle)]">{t('settings.shortcuts.escNote')}</p>
      </Section>
    </div>
  )
}
