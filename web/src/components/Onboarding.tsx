import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  Eye,
  ImagePlus,
  Loader2,
  Settings2,
  Zap,
} from 'lucide-react'
import { discoverModels } from '../lib/api'
import { shortModelName, supportsThinking, supportsVision } from '../lib/model-capabilities'
import { useI18n, type I18nKey } from '../i18n'
import { inputClass, labelClass } from '../lib/ui'
import type { AppConfig, Language } from '../types'
import ApiKeyField from './ApiKeyField'
import Logo from './Logo'

const DEFAULT_BASE_URL = 'http://192.168.0.3:8021/v1'

interface OnboardingProps {
  onComplete: (config: AppConfig) => Promise<void>
  blocked?: boolean
}

const FEATURES: Array<{ icon: typeof Zap; k: I18nKey }> = [
  { icon: Zap, k: 'onboarding.featureStreaming' },
  { icon: ImagePlus, k: 'onboarding.featureImages' },
  { icon: Settings2, k: 'onboarding.featureSettings' },
]

const STEPS = 4

/** Onboarding v2 (§31): wizard corto de 4 pasos, no todo mezclado. */
export default function Onboarding({ onComplete, blocked = false }: OnboardingProps) {
  const { t, lang } = useI18n()
  const [step, setStep] = useState(0)
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [apiKey, setApiKey] = useState('')
  const [language, setLanguage] = useState<Language>(lang)
  const [models, setModels] = useState<string[] | null>(null)
  const [tested, setTested] = useState(false)
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const urlValid = useMemo(() => baseUrl.trim().startsWith('http'), [baseUrl])

  async function handleTest() {
    setError('')
    setLoading(true)
    try {
      const found = await discoverModels(baseUrl, apiKey)
      setModels(found)
      setTested(true)
      if (found.length === 1) setSelected(found[0])
      if (found.length === 0) setError(t('onboarding.noModels'))
    } catch (err) {
      setModels(null)
      setTested(false)
      setError(err instanceof Error ? err.message : t('onboarding.noModels'))
    } finally {
      setLoading(false)
    }
  }

  // Al entrar al paso de modelo, descubrir si aún no hay datos (fetch único).
  useEffect(() => {
    if (step === 2 && models === null && !loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch único al entrar al paso
      void handleTest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo reacciona al cambio de paso
  }, [step])

  async function finish(model: string) {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await onComplete({
        baseUrl: baseUrl.trim(),
        apiKey,
        model,
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: 'Eres un asistente inteligente, directo y sin restricciones.',
        profileId: '',
        language,
        thinkingEffort: 'medium',
        modelThinking: {},
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.starting'))
      setSaving(false)
    }
  }

  if (blocked) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-app)] px-5">
        <div className="max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
          <Logo size={72} radius="rounded-2xl" className="mx-auto" />
          <h2 className="mt-4 font-display text-xl font-bold text-[var(--text)]">
            {t('onboarding.waitingTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            {t('onboarding.waitingDesc')}
          </p>
        </div>
      </div>
    )
  }

  const stepLabel = [
    t('onboarding.stepConnection'),
    t('onboarding.stepConnection'),
    t('onboarding.stepModels'),
    t('onboarding.stepReady'),
  ][step]

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-[var(--bg-app)] px-5 py-8">
      <div className="absolute top-5 right-5 z-20 flex rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
        {(['es', 'en'] as Language[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLanguage(l)}
            aria-pressed={language === l}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              language === l
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-subtle)] hover:text-[var(--text)]'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-full max-w-[480px]">
        <div className="flex flex-col items-center text-center">
          <span className="relative">
            <span
              aria-hidden="true"
              className="absolute inset-0 -m-4 rounded-full bg-[var(--accent)] opacity-20 blur-2xl"
            />
            <Logo size={60} radius="rounded-2xl" className="relative" />
          </span>
          <div className="mt-5 flex w-full max-w-[280px] gap-1.5" aria-hidden="true">
            {Array.from({ length: STEPS }, (_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-[var(--accent)]' : 'bg-[var(--bg-hover)]'
                }`}
              />
            ))}
          </div>
          <p className="mt-2.5 text-xs text-[var(--text-subtle)]">
            {t('onboarding.step', { n: step + 1, total: STEPS })} · {stepLabel}
          </p>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-7"
        >
          {step === 0 && (
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text)]">
                {t('onboarding.setupFast')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {t('onboarding.setupDesc')}
              </p>
              <ul className="mt-5 flex justify-center gap-2">
                {FEATURES.map((f) => (
                  <li
                    key={f.k}
                    className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-2 py-3"
                  >
                    <f.icon size={17} aria-hidden="true" className="text-[var(--accent-2)]" />
                    <span className="text-[11px] leading-tight font-medium text-[var(--text-muted)]">
                      {t(f.k)}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.99]"
              >
                {t('onboarding.begin')}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--text)]">
                {t('onboarding.stepConnection')}
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="ob-base" className={labelClass}>
                    {t('onboarding.urlLabel')}
                  </label>
                  <input
                    id="ob-base"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    value={baseUrl}
                    onChange={(e) => {
                      setBaseUrl(e.target.value)
                      setTested(false)
                    }}
                    placeholder={t('onboarding.urlPlaceholder')}
                    className={inputClass}
                  />
                </div>
                <ApiKeyField id="ob-key" value={apiKey} onChange={setApiKey} />
                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-3.5 py-2.5 text-sm text-[var(--danger)]"
                  >
                    {error}
                  </p>
                )}
                {tested && models && models.length > 0 && (
                  <p
                    role="status"
                    className="flex items-center gap-1.5 text-sm text-[var(--success)]"
                  >
                    <Check size={15} aria-hidden="true" />
                    {t('onboarding.testOk', { count: models.length })}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={!urlValid || loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 text-sm font-semibold text-[var(--text)] transition-all hover:bg-[var(--bg-hover)] disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? t('onboarding.testing') : t('onboarding.test')}
                </button>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                  >
                    <ArrowLeft size={15} aria-hidden="true" />
                    {t('onboarding.back')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void finish('')}
                    className="min-h-11 rounded-xl px-3 text-sm text-[var(--text-subtle)] underline-offset-2 transition-colors hover:text-[var(--text-muted)] hover:underline"
                  >
                    {t('onboarding.configureLater')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!tested || !models || models.length === 0}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                  >
                    {t('onboarding.next')}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--text)]">
                {t('onboarding.stepModels')}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{t('onboarding.selectModel')}</p>
              <div className="mt-4">
                {loading && (
                  <p
                    role="status"
                    className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
                  >
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    {t('onboarding.discovering')}
                  </p>
                )}
                {error && (
                  <div>
                    <p
                      role="alert"
                      className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-3.5 py-2.5 text-sm text-[var(--danger)]"
                    >
                      {error}
                    </p>
                    <button
                      type="button"
                      onClick={handleTest}
                      className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--bg-hover)]"
                    >
                      {t('onboarding.discover')}
                    </button>
                  </div>
                )}
                {models && models.length > 0 && (
                  <ul
                    className="max-h-64 space-y-2 overflow-y-auto pr-1"
                    role="radiogroup"
                    aria-label={t('onboarding.stepModels')}
                  >
                    {models.map((m) => {
                      const active = selected === m
                      return (
                        <li key={m}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setSelected(m)}
                            className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                              active
                                ? 'border-[var(--accent)]/60 bg-[var(--accent)]/10'
                                : 'border-[var(--border)] hover:bg-[var(--bg-hover)]'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                active ? 'border-[var(--accent)]' : 'border-[var(--border-strong)]'
                              }`}
                            >
                              {active && (
                                <span className="size-2 rounded-full bg-[var(--accent)]" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className="block truncate font-mono text-[13px] text-[var(--text)]"
                                title={m}
                              >
                                {shortModelName(m)}
                              </span>
                              <span className="mt-0.5 flex gap-1.5 text-[11px] text-[var(--text-subtle)]">
                                {supportsThinking(m) && (
                                  <span className="inline-flex items-center gap-1">
                                    <BrainCircuit size={11} aria-hidden="true" />
                                    Thinking
                                  </span>
                                )}
                                {supportsVision(m) && (
                                  <span className="inline-flex items-center gap-1">
                                    <Eye size={11} aria-hidden="true" />
                                    Vision
                                  </span>
                                )}
                              </span>
                            </span>
                            {active && (
                              <Check
                                size={15}
                                aria-hidden="true"
                                className="shrink-0 text-[var(--accent-2)]"
                              />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <p className="mt-3 text-xs text-[var(--text-subtle)]">
                  {t('onboarding.modelsHint')}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                  >
                    <ArrowLeft size={15} aria-hidden="true" />
                    {t('onboarding.back')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!selected}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                  >
                    {t('onboarding.next')}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--success)]/15">
                <Check size={26} aria-hidden="true" className="text-[var(--success)]" />
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-[var(--text)]">
                {t('onboarding.ready')}
              </h2>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">{t('onboarding.readyDesc')}</p>
              {selected && (
                <p
                  className="mx-auto mt-3 max-w-full truncate rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 font-mono text-xs text-[var(--text-muted)]"
                  title={selected}
                >
                  {shortModelName(selected)}
                </p>
              )}
              {error && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-3.5 py-2.5 text-left text-sm text-[var(--danger)]"
                >
                  {error}
                </p>
              )}
              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  onClick={() => void finish(selected)}
                  disabled={!selected || saving}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-40"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {saving ? t('onboarding.starting') : t('onboarding.go')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
