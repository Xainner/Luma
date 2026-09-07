import { useState } from 'react'
import { BrainCircuit, Check, Eye, Loader2, RefreshCw } from 'lucide-react'
import type { AppConfig, ThoughtEffort } from '../../types'
import { useI18n } from '../../i18n'
import {
  modelBadges,
  shortModelName,
  supportsThinking,
  supportsVision,
} from '../../lib/model-capabilities'
import { Section } from './parts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

const EFFORTS: ThoughtEffort[] = ['off', 'low', 'medium', 'high']

interface ModelSettingsProps {
  config: AppConfig
  models: string[]
  readOnly: boolean
  onDiscover: () => Promise<string[]>
  onSetDefault: (model: string) => Promise<void>
  onSetThinking: (model: string, effort: ThoughtEffort | null) => Promise<void>
}

/** Settings > Modelos (§22): vista propia, default + override por modelo. Inmediato. */
export default function ModelSettings({
  config,
  models,
  readOnly,
  onDiscover,
  onSetDefault,
  onSetThinking,
}: ModelSettingsProps) {
  const { t } = useI18n()
  const [discovering, setDiscovering] = useState(false)
  const [error, setError] = useState('')

  async function handleDiscover() {
    setError('')
    setDiscovering(true)
    try {
      const found = await onDiscover()
      if (found.length === 0) setError(t('settings.noModels'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.discovering'))
    } finally {
      setDiscovering(false)
    }
  }

  const effortLabel = (e: ThoughtEffort | undefined) =>
    e === 'off'
      ? t('thinking.off')
      : e === 'low'
        ? t('thinking.low')
        : e === 'high'
          ? t('thinking.high')
          : t('thinking.medium')

  return (
    <div className="space-y-6">
      <Section
        title={t('settings.nav.models')}
        desc={`${t('settings.models.subtitle')} ${t('settings.models.changeInComposer')}`}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDiscover}
            disabled={discovering || readOnly}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--bg-hover)] disabled:opacity-60"
          >
            {discovering ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {discovering ? t('settings.discovering') : t('settings.discover')}
          </button>
        </div>

        {error && (
          <p className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-3.5 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        {models.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-8 text-center">
            <p className="text-sm font-medium text-[var(--text)]">{t('settings.models.empty')}</p>
            <p className="mt-1 text-xs text-[var(--text-subtle)]">
              {t('settings.models.emptyHint')}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {models.map((m) => {
              const isDefault = config.model === m
              const override = config.modelThinking?.[m]
              const badges = modelBadges(m)
              return (
                <li
                  key={m}
                  className={`rounded-xl border px-3.5 py-3 ${
                    isDefault
                      ? 'border-[var(--accent)]/50 bg-[var(--accent)]/5'
                      : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text)]" title={m}>
                        {shortModelName(m)}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-subtle)]">
                        {supportsThinking(m) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 font-medium text-[var(--accent-2)]">
                            <BrainCircuit size={11} aria-hidden="true" />
                            {t('settings.models.capThinking')}
                          </span>
                        )}
                        {supportsVision(m) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 font-medium text-[var(--accent-2)]">
                            <Eye size={11} aria-hidden="true" />
                            {t('settings.models.capVision')}
                          </span>
                        )}
                        {badges.length === 0 && <span>{t('settings.models.capText')}</span>}
                      </p>
                    </div>
                    {isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)]/15 px-2 py-1 text-xs font-semibold text-[var(--accent-2)]">
                        <Check size={12} aria-hidden="true" />
                        {t('settings.models.currentDefault')}
                      </span>
                    ) : (
                      !readOnly && (
                        <button
                          type="button"
                          onClick={() => void onSetDefault(m)}
                          className="min-h-11 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                        >
                          {t('settings.models.setDefault')}
                        </button>
                      )
                    )}
                    {!readOnly && supportsThinking(m) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`${t('settings.models.thinkingOverride')}: ${m}`}
                            className="min-h-11 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                          >
                            {override
                              ? effortLabel(override)
                              : t('settings.models.useGlobal', {
                                  level: effortLabel(config.thinkingEffort ?? 'medium'),
                                })}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => void onSetThinking(m, null)}>
                            {t('settings.models.useGlobal', {
                              level: effortLabel(config.thinkingEffort ?? 'medium'),
                            })}
                          </DropdownMenuItem>
                          {EFFORTS.map((e) => (
                            <DropdownMenuItem key={e} onSelect={() => void onSetThinking(m, e)}>
                              {effortLabel(e)}
                              {override === e && (
                                <Check size={13} className="ml-auto" aria-hidden="true" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </div>
  )
}
