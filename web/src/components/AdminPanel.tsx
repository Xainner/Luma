import { useEffect, useState } from 'react'
import { Check, KeyRound, Loader2, Plus, Shield, Trash2, Users } from 'lucide-react'
import type { AdminUser, ConfigScope, User } from '../types'
import { createUser, deleteUser, listUsers, updateUser } from '../lib/api'
import { inputClass } from '../lib/ui'

interface AdminPanelProps {
  scope: ConfigScope
  systemPrompt: string
  onSetScope: (scope: ConfigScope) => Promise<void>
  onSaveSystemPrompt: (prompt: string) => Promise<void>
}

export default function AdminPanel({
  scope,
  systemPrompt,
  onSetScope,
  onSaveSystemPrompt,
}: AdminPanelProps) {
  const [promptDraft, setPromptDraft] = useState(systemPrompt)
  const [savingPrompt, setSavingPrompt] = useState(false)
  const [promptSaved, setPromptSaved] = useState(false)

  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<User['role']>('user')
  const [creating, setCreating] = useState(false)
  const [resetPwFor, setResetPwFor] = useState('')
  const [resetPwValue, setResetPwValue] = useState('')
  const [confirmDel, setConfirmDel] = useState('')

  async function load() {
    setUsersLoading(true)
    try {
      setUsers(await listUsers())
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.')
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleSavePrompt() {
    if (savingPrompt) return
    setSavingPrompt(true)
    try {
      await onSaveSystemPrompt(promptDraft)
      setPromptSaved(true)
      setTimeout(() => setPromptSaved(false), 1600)
    } finally {
      setSavingPrompt(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setUsersError('')
    try {
      await createUser(newEmail.trim(), newPassword, newRole)
      setNewEmail('')
      setNewPassword('')
      setNewRole('user')
      await load()
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setCreating(false)
    }
  }

  async function handleRoleChange(id: string, role: User['role']) {
    try {
      await updateUser(id, { role })
      await load()
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'No se pudo cambiar el rol.')
    }
  }

  async function handleResetPassword(id: string) {
    try {
      await updateUser(id, { password: resetPwValue })
      setResetPwFor('')
      setResetPwValue('')
      await load()
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.')
    }
  }

  async function handleDelete(id: string) {
    if (confirmDel !== id) {
      setConfirmDel(id)
      setTimeout(() => setConfirmDel((c) => (c === id ? '' : c)), 3000)
      return
    }
    try {
      await deleteUser(id)
      setConfirmDel('')
      await load()
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.')
    }
  }

  const toggleBtn = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-nebula-500 to-iris-600 text-white shadow'
        : 'text-mist-500 hover:text-mist-200'
    }`

  return (
    <div className="space-y-6">
      {/* Scope de configuración */}
      <section className="rounded-2xl border border-white/10 bg-ink-900/70 p-5">
        <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-mist-100">
          <Shield size={16} className="text-iris-400" /> Alcance de la configuración
        </h3>
        <p className="mb-4 text-sm text-mist-500">
          <strong>Global:</strong> todos usan la misma configuración (la gestionas tú).{' '}
          <strong>Por usuario:</strong> cada usuario configura su propia URL, key y modelo.
          El system prompt y los perfiles siempre son globales.
        </p>
        <div className="flex max-w-sm rounded-xl border border-white/10 bg-ink-850 p-1">
          <button type="button" className={toggleBtn(scope === 'global')} onClick={() => void onSetScope('global')}>
            Global
          </button>
          <button type="button" className={toggleBtn(scope === 'user')} onClick={() => void onSetScope('user')}>
            Por usuario
          </button>
        </div>
      </section>

      {/* System prompt */}
      <section className="rounded-2xl border border-white/10 bg-ink-900/70 p-5">
        <h3 className="mb-1 font-display text-base font-bold text-mist-100">System prompt global</h3>
        <p className="mb-4 text-sm text-mist-500">
          Solo el administrador puede modificarlo. Se aplica a todas las conversaciones, además del
          master prompt del perfil activo.
        </p>
        <textarea
          rows={4}
          value={promptDraft}
          onChange={(e) => setPromptDraft(e.target.value)}
          className={`${inputClass} resize-y`}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSavePrompt()}
            disabled={savingPrompt || promptDraft === systemPrompt}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-nebula-500 to-iris-600 px-4 py-2 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingPrompt ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Guardar system prompt
          </button>
          {promptSaved && <span className="text-sm text-nebula-300">Guardado</span>}
        </div>
      </section>

      {/* Usuarios */}
      <section className="rounded-2xl border border-white/10 bg-ink-900/70 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-mist-100">
          <Users size={16} className="text-iris-400" /> Usuarios
        </h3>

        <form onSubmit={handleCreate} className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input
            type="email"
            aria-label="Email del nuevo usuario"
            placeholder="nuevo@correo.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="password"
            aria-label="Contraseña del nuevo usuario"
            placeholder="Contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            minLength={4}
            required
          />
          <select
            aria-label="Rol del nuevo usuario"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as User['role'])}
            className={inputClass}
          >
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={creating || !newEmail || !newPassword}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-mist-100 transition-all hover:border-nebula-400/50 hover:bg-white/10 disabled:opacity-50"
          >
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Crear
          </button>
        </form>

        {usersError && (
          <p className="mb-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2 text-sm text-red-300">
            {usersError}
          </p>
        )}

        {usersLoading && <p className="text-sm text-mist-600">Cargando usuarios…</p>}

        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-ink-850 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm text-mist-100">{u.email}</span>
              {u.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-iris-500/15 px-2 py-0.5 text-xs font-semibold text-iris-300">
                  <Shield size={11} /> Admin
                </span>
              ) : (
                <span className="rounded-lg bg-white/5 px-2 py-0.5 text-xs font-semibold text-mist-400">
                  Usuario
                </span>
              )}
              <select
                aria-label={`Cambiar rol de ${u.email}`}
                value={u.role}
                onChange={(e) => void handleRoleChange(u.id, e.target.value as User['role'])}
                className="rounded-lg border border-white/10 bg-ink-800 px-2 py-1 text-xs text-mist-200 focus:border-nebula-400/60 focus:outline-none"
              >
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
              {resetPwFor === u.id ? (
                <span className="flex items-center gap-2">
                  <input
                    type="password"
                    aria-label={`Nueva contraseña para ${u.email}`}
                    placeholder="Nueva contraseña"
                    value={resetPwValue}
                    onChange={(e) => setResetPwValue(e.target.value)}
                    className="w-36 rounded-lg border border-white/10 bg-ink-800 px-2 py-1 text-xs text-mist-100 focus:border-nebula-400/60 focus:outline-none"
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => void handleResetPassword(u.id)}
                    disabled={resetPwValue.length < 4}
                    className="rounded-lg bg-nebula-500/20 px-2 py-1 text-xs font-semibold text-nebula-300 hover:bg-nebula-500/30 disabled:opacity-40"
                  >
                    OK
                  </button>
                  <button type="button" onClick={() => setResetPwFor('')} className="text-xs text-mist-500 hover:text-mist-200">
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setResetPwFor(u.id)
                    setResetPwValue('')
                  }}
                  aria-label={`Cambiar contraseña de ${u.email}`}
                  className="rounded-lg p-1.5 text-mist-500 transition-colors hover:bg-white/5 hover:text-mist-200"
                >
                  <KeyRound size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleDelete(u.id)}
                aria-label={`Eliminar ${u.email}`}
                className={`rounded-lg p-1.5 transition-colors ${
                  confirmDel === u.id ? 'bg-red-500/20 text-red-300' : 'text-mist-500 hover:bg-red-500/15 hover:text-red-400'
                }`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
