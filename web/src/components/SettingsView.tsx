import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Loader2, RefreshCw, Save, Trash2 } from 'lucide-react'
import type { AppConfig } from '../types'
import { MASKED_KEY } from '../types'
import { inputClass, labelClass } from '../lib/ui'
import ApiKeyField from './ApiKeyField'

interface SettingsViewProps {
  config: AppConfig
  models: string[]
  onDiscover: (baseUrl?: string, apiKey?: string) => Promise<string[]>
  onSave: (config: AppConfig) => Promise<void>
  onBack: () => void
  onWipeData: () => Promise<void>
}

export default function SettingsView({
  config,
  models,
  onDiscover,
  onSave,
  onBack,
  onWipeData,
}: SettingsViewProps) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl)
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [model, setModel] = useState(config.model)
  const [temperature, setTemperature] = useState(config.temperature)
  const [maxTokens, setMaxTokens] = useState(config.maxTokens)
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  const [discoverError, setDiscoverError] = useState('')
  const [confirmWipe, setConfirmWipe] = useState(false)

  const dirty = useMemo(
    () =>
      baseUrl !== config.baseUrl ||
      apiKey !== config.apiKey ||
      model !== config.model ||
      temperature !== config.temperature ||
      maxTokens !== config.maxTokens ||
      systemPrompt !== config.systemPrompt,
    [config, baseUrl, apiKey, model, temperature, maxTokens, systemPrompt],
  )

  async function handleDiscover() {
    setDiscoverError('')
    setDiscovering(true)
    try {
      const found = await onDiscover(baseUrl, apiKey === MASKED_KEY ? undefined : apiKey)
      if (found.length === 0) setDiscoverError('No se encontraron modelos en esa URL.')
      else setModel((prev) => (found.includes(prev) ? prev : found[0]))
    } catch (err) {
      setDiscoverError(err instanceof Error ? err.message : 'Error al descubrir modelos.')
    } finally {
      setDiscovering(false)
    }
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setSaved(false)
    try {
      await onSave({
        ...config,
        baseUrl: baseUrl.trim(),
        apiKey: apiKey === MASKED_KEY ? config.apiKey : apiKey.trim(),
        model,
        temperature,
        maxTokens: Math.max(1, Math.floor(Number(maxTokens) || 4096)),
        systemPrompt,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setDiscoverError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleWipe() {
    if (!confirmWipe) {
      setConfirmWipe(true)
      setTimeout(() => setConfirmWipe(false), 3500)
      return
    }
    await onWipeData()
    setConfirmWipe(false)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/8 px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver al chat"
          className="rounded-lg p-2 text-mist-500 transition-colors hover:bg-white/5 hover:text-mist-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-base font-bold tracking-tight text-mist-100">Ajustes</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-2xl space-y-6 px-4 py-6"
        >
          {/* Conexión */}
          <section className="rounded-2xl border border-white/10 bg-ink-900/70 p-5 backdrop-blur-xl">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-mist-100">
              Conexión
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="st-base" className={labelClass}>
                  URL base
                </label>
                <input
                  id="st-base"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://host:puerto/v1"
                  className={inputClass}
                />
              </div>
              <ApiKeyField id="st-key" value={apiKey} onChange={setApiKey} />
            </div>
          </section>

          {/* Modelo */}
          <section className="rounded-2xl border border-white/10 bg-ink-900/70 p-5 backdrop-blur-xl">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-mist-100">
              Modelo
            </h2>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label htmlFor="st-model" className={labelClass}>
                    Modelo activo
                  </label>
                  <select
                    id="st-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className={`${inputClass} ${models.length === 0 ? 'opacity-50' : ''}`}
                  >
                    {models.length === 0 && <option value="">Sin modelos descubiertos</option>}
                    {models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleDiscover}
                  disabled={discovering}
                  className="inline-flex h-[42px] shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm font-medium text-mist-200 transition-all hover:border-nebula-400/50 hover:bg-white/10 disabled:opacity-60"
                >
                  {discovering ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {discovering ? 'Buscando…' : 'Descubrir'}
                </button>
              </div>

              {discoverError && (
                <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2 text-sm text-red-300">
                  {discoverError}
                </p>
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="st-temp" className="text-sm font-medium text-mist-200">
                    Temperatura
                  </label>
                  <span className="font-mono text-sm text-nebula-300">{temperature.toFixed(1)}</span>
                </div>
                <input
                  id="st-temp"
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-iris-500"
                />
                <div className="mt-0.5 flex justify-between text-[11px] text-mist-600">
                  <span>Preciso</span>
                  <span>Creativo</span>
                </div>
              </div>

              <div>
                <label htmlFor="st-tokens" className={labelClass}>
                  Máximo de tokens
                </label>
                <input
                  id="st-tokens"
                  type="number"
                  min={1}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Sistema */}
          <section className="rounded-2xl border border-white/10 bg-ink-900/70 p-5 backdrop-blur-xl">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-mist-100">
              Prompt de sistema
            </h2>
            <textarea
              id="st-prompt"
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define el comportamiento del asistente…"
              className={`${inputClass} resize-y`}
            />
          </section>

          {/* Zona de peligro */}
          <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-red-300">
              Zona de peligro
            </h2>
            <p className="mb-4 text-sm text-mist-500">
              Elimina permanentemente todas las conversaciones guardadas.
            </p>
            <button
              type="button"
              onClick={handleWipe}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                confirmWipe
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/15'
              }`}
            >
              <Trash2 size={16} />
              {confirmWipe ? 'Confirmar borrado' : 'Borrar todos los datos'}
            </button>
          </section>
        </motion.div>
      </div>

      <div className="shrink-0 border-t border-white/8 px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-nebula-300">
              <Check size={15} /> Guardado
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-nebula-500 via-iris-500 to-flare-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(139,92,246,0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
