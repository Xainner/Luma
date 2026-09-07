import { useState } from 'react'
import { Loader2, Lock, LogIn, Mail } from 'lucide-react'
import { useI18n } from '../i18n'
import { inputClass, labelClass } from '../lib/ui'
import Logo from './Logo'

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>
}

/** Login v2 (§30): tarjeta centrada 400–440px, glow tenue, errores inline. */
export default function Login({ onLogin }: LoginProps) {
  const { t } = useI18n()
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
    <div className="flex h-full items-center justify-center overflow-y-auto bg-[var(--bg-app)] px-5 py-8">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center">
          <span className="relative">
            <span
              aria-hidden="true"
              className="absolute inset-0 -m-4 rounded-full bg-[var(--accent)] opacity-20 blur-2xl"
            />
            <Logo size={68} radius="rounded-2xl" className="relative" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-[var(--text)]">
            Luma
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{t('login.title')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="lg-email" className={labelClass}>
                {t('login.email')}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--text-subtle)]"
                />
                <input
                  id="lg-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="lg-pass" className={labelClass}>
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--text-subtle)]"
                />
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
              <p
                role="alert"
                className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-3.5 py-2.5 text-sm text-[var(--danger)]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
