import { useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import type { AppConfig, ThoughtEffort } from '../../types'
import { useI18n } from '../../i18n'
import { supportsThinking } from '../../lib/model-capabilities'
import { Section } from './parts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'

const EFFORTS: ThoughtEffort[] = ['off', 'low', 'medium', 'high']

interface ReasoningSettingsProps {
  config: AppConfig
  models: string[]
  readOnly: boolean
  onSetDefault: (effort: ThoughtEffort) => Promise<void>
  onSetModelThinking: (model: string, effort: ThoughtEffort | null) => Promise<void>
}

/** Settings > Razonamiento (§23): default + por modelo + accordion. Inmediato. */
export default function ReasoningSettings({
  config,
  models,
  readOnly,
  onSetDefault,
  onSetModelThinking,
}: ReasoningSettingsProps) {
  const { t } = useI18n()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const current = config.thinkingEffort ?? 'medium'

  const effortLabel = (e: ThoughtEffort) =>
    e === 'off'
      ? t('thinking.off')
      : e === 'low'
        ? t('thinking.low')
        : e === 'high'
          ? t('thinking.high')
          : t('thinking.medium')

  const thinkingModels = models.filter(supportsThinking)

  return (
    <div className="space-y-6">
      <Section title={t('settings.nav.reasoning')} desc={t('settings.reasoning.defaultDesc')}>
        <div
          role="group"
          aria-label={t('settings.nav.reasoning')}
          className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-1"
        >
          {EFFORTS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => void onSetDefault(e)}
              disabled={readOnly}
              aria-pressed={current === e}
              className={`min-h-11 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                current === e
                  ? 'bg-[var(--accent)] text-white shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {effortLabel(e)}
            </button>
          ))}
        </div>

        <div>
          <h3 className="mb-2 mt-2 text-sm font-semibold text-[var(--text)]">
            {t('settings.reasoning.perModel')}
          </h3>
          {thinkingModels.length === 0 ? (
            <p className="text-xs text-[var(--text-subtle)]">{t('settings.thinkingNoOverrides')}</p>
          ) : (
            <ul className="space-y-1.5">
              {thinkingModels.map((m) => {
                const override = config.modelThinking?.[m]
                return (
                  <li
                    key={m}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-2.5 py-1.5"
                  >
                    <span
                      className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--text-muted)]"
                      title={m}
                    >
                      {m}
                    </span>
                    {readOnly ? (
                      <span className="text-xs text-[var(--text-subtle)]">
                        {override
                          ? effortLabel(override)
                          : t('settings.models.useGlobal', { level: effortLabel(current) })}
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`${t('settings.models.thinkingOverride')}: ${m}`}
                            className="min-h-9 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg-hover)]"
                          >
                            {override
                              ? effortLabel(override)
                              : t('settings.models.useGlobal', { level: effortLabel(current) })}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => void onSetModelThinking(m, null)}>
                            {t('settings.models.useGlobal', { level: effortLabel(current) })}
                          </DropdownMenuItem>
                          {EFFORTS.map((e) => (
                            <DropdownMenuItem
                              key={e}
                              onSelect={() => void onSetModelThinking(m, e)}
                            >
                              {effortLabel(e)}
                              {override === e && (
                                <Check size={13} className="ml-auto" aria-hidden="true" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
          >
            <ChevronRight
              size={15}
              aria-hidden="true"
              className={cn('transition-transform', advancedOpen && 'rotate-90')}
            />
            {t('settings.reasoning.advancedTitle')}
          </button>
          {advancedOpen && (
            <p className="border-t border-[var(--border)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
              {t('settings.reasoning.advancedBody')}
            </p>
          )}
        </div>
      </Section>
    </div>
  )
}
