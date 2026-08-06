import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Loader2, Lock, LogIn, Mail } from 'lucide-react'
import { inputClass, labelClass } from '../lib/ui'
import Logo from './Logo'

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      await onLogin(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
      setLoading(false)
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

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-sm"
      >
        <motion.div variants={item} className="flex flex-col items-center text-center">
          <Logo size={72} radius="rounded-3xl" />
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-mist-100">Luma</h1>
          <p className="mt-1 text-sm text-mist-500">Tu IA, sin cadenas. Inicia sesión para continuar.</p>
        </motion.div>

        <motion.div variants={item} className="mt-8">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-ink-900/70 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="lg-email" className={labelClass}>
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist-600" />
                  <input
                    id="lg-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@luma.local"
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lg-pass" className={labelClass}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist-600" />
                  <input
                    id="lg-pass"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
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

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nebula-500 via-iris-500 to-flare-500 px-4 py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,0.45)] transition-all hover:shadow-[0_8px_36px_rgba(139,92,246,0.6)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {loading ? 'Entrando…' : 'Iniciar sesión'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}
