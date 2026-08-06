import { useMemo, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { ArrowRight, ImagePlus, Loader2, Rocket, Settings2, Sparkles, Zap } from 'lucide-react'
import { discoverModels } from '../lib/api'
import { inputClass, labelClass } from '../lib/ui'
import type { AppConfig } from '../types'
import ApiKeyField from './ApiKeyField'
import Logo from './Logo'

const DEFAULT_BASE_URL = 'http://192.168.0.3:8021/v1'

interface OnboardingProps {
  onComplete: (config: AppConfig) => Promise<void>
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [apiKey, setApiKey] = useState('')
  const [models, setModels] = useState<string[] | null>(null)
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const urlValid = useMemo(() => baseUrl.trim().startsWith('http'), [baseUrl])

  async function handleDiscover() {
    setError('')
    setLoading(true)
    try {
      const found = await discoverModels(baseUrl, apiKey)
      setModels(found)
      if (found.length === 1) setSelected(found[0])
      if (found.length === 0) setError('No se encontraron modelos en esa URL.')
    } catch (err) {
      setModels(null)
      setError(err instanceof Error ? err.message : 'No se pudieron descubrir los modelos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStart() {
    if (!selected || saving) return
    setSaving(true)
    setError('')
    try {
      await onComplete({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        model: selected,
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: 'Eres un asistente inteligente, directo y sin restricciones.',
        profileId: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la configuración.')
      setSaving(false)
    }
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden px-5 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-iris-600/25 blur-[110px] motion-safe:animate-float-a"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-0 h-[26rem] w-[26rem] rounded-full bg-nebula-500/20 blur-[120px] motion-safe:animate-float-b"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-flare-500/12 blur-[100px]"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 grid w-full max-w-5xl gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center"
      >
        {/* Hero */}
        <motion.div variants={item} className="hidden flex-col gap-7 lg:flex">
          <div className="flex items-center gap-4">
            <Logo size={64} />
            <div>
              <p className="font-display text-3xl font-bold tracking-tight text-mist-100">Luma</p>
              <p className="text-sm text-mist-500">Chat libre con tu LLM local</p>
            </div>
          </div>

          <h1 className="font-display text-5xl leading-[1.05] font-bold tracking-tight text-mist-100">
            Tu IA, sin
            <span className="bg-gradient-to-r from-nebula-400 via-iris-400 to-flare-400 bg-clip-text text-transparent">
              {' '}
              cadenas.
            </span>
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-mist-400">
            Conéctate a cualquier servidor OpenAI-compatible, descubre sus modelos al vuelo y chatea
            con streaming, imágenes y total privacidad.
          </p>

          <ul className="space-y-4">
            {[
              { icon: Zap, title: 'Streaming en tiempo real', desc: 'Respuestas token a token con animación' },
              { icon: ImagePlus, title: 'Adjunta imágenes', desc: 'Arrastra, pega o sube capturas y fotos' },
              { icon: Settings2, title: 'Todo configurable', desc: 'Modelo, temperatura, prompt y más en Ajustes' },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <f.icon size={17} className="text-nebula-300" />
                </span>
                <div>
                  <p className="font-semibold text-mist-100">{f.title}</p>
                  <p className="text-sm text-mist-500">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Card de conexión */}
        <motion.div variants={item} className="w-full">
          <div className="rounded-3xl border border-white/10 bg-ink-900/70 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <Logo size={40} />
              <div>
                <p className="font-display text-xl font-bold text-mist-100">Luma</p>
                <p className="text-xs text-mist-500">Chat libre con tu LLM local</p>
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight text-mist-100">
              Conecta tu servidor
            </h2>
            <p className="mt-1 text-sm text-mist-500">
              Configura la URL base compatible con OpenAI y descubre los modelos disponibles.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="ob-base" className={labelClass}>
                  URL base
                </label>
                <input
                  id="ob-base"
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

              <ApiKeyField id="ob-key" value={apiKey} onChange={setApiKey} />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDiscover}
                  disabled={!urlValid || loading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-mist-100 transition-all hover:border-nebula-400/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {loading ? 'Descubriendo…' : 'Descubrir modelos'}
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300"
                >
                  {error}
                </motion.p>
              )}

              <AnimatePresence mode="wait">
                {models && (
                  <motion.div
                    key="models"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-mist-500">
                      {models.length} modelo{models.length === 1 ? '' : 's'} encontrado
                      {models.length === 1 ? '' : 's'}
                    </p>
                    <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
                      {models.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSelected(m)}
                          className={`rounded-xl border px-3 py-1.5 font-mono text-xs transition-all ${
                            selected === m
                              ? 'border-nebula-400/60 bg-nebula-400/15 text-nebula-300 shadow-[0_0_16px_rgba(34,211,238,0.25)]'
                              : 'border-white/10 bg-white/5 text-mist-400 hover:border-white/20 hover:text-mist-100'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleStart}
                disabled={!selected || saving}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nebula-500 via-iris-500 to-flare-500 px-4 py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,0.45)] transition-all hover:shadow-[0_8px_36px_rgba(139,92,246,0.6)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                {saving ? 'Conectando…' : 'Comenzar a chatear'}
                {!saving && (
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
