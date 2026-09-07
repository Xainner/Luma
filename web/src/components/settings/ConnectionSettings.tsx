import { useState } from 'react'
import { Check, Info, Loader2, Pencil, Trash2 } from 'lucide-react'
import type { AppConfig } from '../../types'
import { useI18n } from '../../i18n'
import ApiKeyField from '../ApiKeyField'
import { inputClass, labelClass, Section } from './parts'

interface ConnectionSettingsProps {
  config: AppConfig
  apiKeySet: boolean
  readOnly: boolean
  onDiscover: (baseUrl?: string, apiKey?: string) => Promise<string[]>
  onSave: (patch: { baseUrl: string; apiKey: string; clearApiKey: boolean }) => Promise<void>
}

/** Settings > Conexión (§21): estado + edición explícita. Sin barra global. */
export default function ConnectionSettings({
  config,
  apiKeySet,
  readOnly,
  onDiscover,
  onSave,
}: ConnectionSettingsProps) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [baseUrl, setBaseUrl] = useState(config.baseUrl)
  const [apiKey, setApiKey] = useState('')
  const [clearKey, setClearKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [lastCount, setLastCount] = useState<number | null>(null)
  const [error, setError] = useState('')

  if (readOnly) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
        <div className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
          <Info size={17} className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <div>
            <p className="font-semibold text-[var(--text)]">
              {t('settings.connection.globalManaged')}
            </p>
            <p className="mt-1">{t('settings.connection.globalManagedDesc')}</p>
          </div>
        </div>
      </div>
    )
  }

  async function handleTest() {
    setTesting(true)
    setError('')
    try {
      const found = await onDiscover(editing ? baseUrl : undefined, apiKey || undefined)
      setLastCheck(new Date())
      setLastCount(found.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.connection.testFail'))
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await onSave({ baseUrl: baseUrl.trim(), apiKey, clearApiKey: clearKey })
      setApiKey('')
      setClearKey(false)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.connection.testFail'))
    } finally {
      setSaving(false)
    }
  }

  const dirty = baseUrl.trim() !== config.baseUrl || apiKey !== '' || clearKey

  return (
    <div className="space-y-6">
      <Section title={t('settings.connection.status')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <span className="relative flex size-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[var(--success)]" />
              </span>
              {t('settings.connection.connected')}
            </p>
            <p className="mt-1 truncate font-mono text-xs text-[var(--text-subtle)]">
              {config.baseUrl}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-subtle)]">
              {t('settings.connection.lastCheck', {
                when: lastCheck ? lastCheck.toLocaleTimeString() : t('settings.connection.never'),
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--bg-hover)] disabled:opacity-60"
            >
              {testing ? <Loader2 size={15} className="animate-spin" /> : null}
              {testing ? t('settings.connection.testing') : t('settings.connection.test')}
            </button>
            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setBaseUrl(config.baseUrl)
                  setEditing(true)
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--bg-hover)]"
              >
                <Pencil size={15} />
                {t('settings.connection.edit')}
              </button>
            )}
          </div>
        </div>
        {lastCount !== null && !error && (
          <p className="flex items-center gap-1.5 text-sm text-[var(--success)]">
            <Check size={15} aria-hidden="true" />
            {t('settings.connection.testOk', { n: lastCount })}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-3.5 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
      </Section>

      {editing && (
        <Section title={t('settings.connection.edit')}>
          <div>
            <label htmlFor="cn-base" className={labelClass}>
              {t('settings.urlLabel')}
            </label>
            <input
              id="cn-base"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <ApiKeyField id="cn-key" value={apiKey} onChange={setApiKey} hasStored={apiKeySet} />
            {!apiKey && (
              <p className="mt-1.5 text-xs text-[var(--text-subtle)]">
                API key:{' '}
                {apiKeySet
                  ? t('settings.connection.keyConfigured')
                  : t('settings.connection.keyMissing')}
              </p>
            )}
            {apiKeySet && (
              <button
                type="button"
                onClick={() => setClearKey((v) => !v)}
                className={`mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  clearKey
                    ? 'border-[var(--danger)] bg-[var(--danger)] text-white'
                    : 'border-[var(--danger)]/40 text-[var(--danger)] hover:bg-[var(--danger)]/10'
                }`}
              >
                <Trash2 size={12} />
                {clearKey ? t('apikey.confirmRemove') : t('apikey.remove')}
              </button>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
            >
              {t('admin.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {t('settings.save')}
            </button>
          </div>
        </Section>
      )}
    </div>
  )
}
