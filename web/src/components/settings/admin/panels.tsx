import { Check, Loader2 } from 'lucide-react'
import type { ConfigScope } from '../../../types'
import { useI18n } from '../../../i18n'
import { inputClass, Section } from '../parts'
import { useState } from 'react'

/** Admin > Configuración global (§28.2): scope con explicación de impacto. */
export function GlobalConfigAdmin({
  scope,
  onSetScope,
}: {
  scope: ConfigScope
  onSetScope: (scope: ConfigScope) => Promise<void>
}) {
  const { t } = useI18n()
  return (
    <Section title={t('settings.admin.tabs.global')} desc={t('settings.admin.globalDesc')}>
      <div
        role="group"
        aria-label={t('admin.scope')}
        className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-1"
      >
        {(['global', 'user'] as ConfigScope[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void onSetScope(s)}
            aria-pressed={scope === s}
            className={`min-h-11 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              scope === s
                ? 'bg-[var(--accent)] text-white shadow'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {s === 'global' ? t('admin.global') : t('admin.perUser')}
          </button>
        ))}
      </div>
    </Section>
  )
}

/** Admin > System prompt (§28.3): editor amplio con guardado explícito. */
export function SystemPromptAdmin({
  systemPrompt,
  onSave,
}: {
  systemPrompt: string
  onSave: (prompt: string) => Promise<void>
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState(systemPrompt)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  async function handleSave() {
    if (saving || draft === systemPrompt) return
    setSaving(true)
    try {
      await onSave(draft)
      setSaved(true)
      setSavedAt(new Date())
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title={t('admin.systemPrompt')} desc={t('admin.systemPromptDesc')}>
      <textarea
        rows={8}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        aria-label={t('admin.systemPrompt')}
        className={`${inputClass} resize-y`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || draft === systemPrompt}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {saved ? t('admin.saved') : t('admin.savePrompt')}
        </button>
        {savedAt && (
          <span className="text-xs text-[var(--text-subtle)]">
            {t('settings.admin.lastSaved', { when: savedAt.toLocaleTimeString() })}
          </span>
        )}
      </div>
    </Section>
  )
}

/** Admin > Estado (§28.4): solo lo que el backend ya expone. Sin métricas inventadas. */
export function StatusAdmin({
  baseUrl,
  modelsCount,
  scope,
  version,
  upstreamOk,
  onTest,
}: {
  baseUrl: string
  modelsCount: number
  scope: ConfigScope
  version: string
  upstreamOk: boolean | null
  onTest: () => Promise<void>
}) {
  const { t } = useI18n()
  const [testing, setTesting] = useState(false)

  async function handleTest() {
    setTesting(true)
    try {
      await onTest()
    } finally {
      setTesting(false)
    }
  }

  const rows: Array<[string, string, boolean | null]> = [
    [t('settings.admin.statusApi'), t('settings.admin.reachable'), true],
    [
      t('settings.admin.statusUpstream'),
      upstreamOk === null
        ? '—'
        : upstreamOk
          ? t('settings.admin.reachable')
          : t('settings.admin.unreachable'),
      upstreamOk,
    ],
    [t('settings.admin.statusModels'), String(modelsCount), null],
    [t('settings.admin.statusVersion'), version, null],
    [
      t('settings.admin.statusScope'),
      scope === 'global' ? t('admin.global') : t('admin.perUser'),
      null,
    ],
  ]

  return (
    <Section title={t('settings.admin.tabs.status')}>
      <p className="truncate font-mono text-xs text-[var(--text-subtle)]">{baseUrl}</p>
      <ul className="divide-y divide-[var(--border)]">
        {rows.map(([label, value, ok]) => (
          <li key={label} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-[var(--text-muted)]">{label}</span>
            <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-[var(--text)]">
              {ok !== null && (
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${ok ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}
                />
              )}
              {value}
            </span>
          </li>
        ))}
      </ul>
      <div>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--bg-hover)] disabled:opacity-60"
        >
          {testing ? <Loader2 size={15} className="animate-spin" /> : null}
          {testing ? t('settings.connection.testing') : t('settings.connection.test')}
        </button>
      </div>
    </Section>
  )
}
