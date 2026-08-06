import { useState } from 'react'
import { Check, Plus, Save, Trash2, UserRound } from 'lucide-react'
import type { Profile } from '../types'
import { inputClass, labelClass } from '../lib/ui'

interface ProfilesManagerProps {
  profiles: Profile[]
  activeProfileId: string
  onCreate: (profile: Partial<Profile>) => Promise<Profile>
  onUpdate: (profile: Profile) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSetActive: (id: string) => void
}

const DEFAULT_COLORS = ['#8b5cf6', '#22d3ee', '#e879f9', '#34d399', '#f59e0b', '#f87171']

function ProfileCard({
  profile,
  isActive,
  onUpdate,
  onDelete,
  onSetActive,
}: {
  profile: Profile
  isActive: boolean
  onUpdate: (p: Profile) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSetActive: (id: string) => void
}) {
  const [name, setName] = useState(profile.name)
  const [emoji, setEmoji] = useState(profile.emoji)
  const [color, setColor] = useState(profile.color)
  const [masterPrompt, setMasterPrompt] = useState(profile.masterPrompt)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dirty =
    name !== profile.name ||
    emoji !== profile.emoji ||
    color !== profile.color ||
    masterPrompt !== profile.masterPrompt

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      await onUpdate({ ...profile, name: name.trim() || 'Sin nombre', emoji, color, masterPrompt })
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    await onDelete(profile.id)
  }

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${isActive ? 'border-iris-500/40 bg-iris-500/5' : 'border-white/10 bg-ink-900/70'}`}>
      <div className="flex items-start gap-3">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: `${color}22`, border: `1px solid ${color}55` }}
          aria-hidden="true"
        >
          {emoji || '✨'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              aria-label="Nombre del perfil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del perfil"
              className={`${inputClass} flex-1`}
            />
            <input
              aria-label="Emoji del perfil"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="✨"
              className={`${inputClass} w-14 text-center`}
            />
            <input
              type="color"
              aria-label="Color del perfil"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-[42px] w-11 cursor-pointer rounded-xl border border-white/10 bg-ink-850 p-1"
            />
          </div>

          <label htmlFor={`master-${profile.id}`} className={labelClass}>
            Master prompt <span className="text-mist-600">(se añade tras el system prompt)</span>
          </label>
          <textarea
            id={`master-${profile.id}`}
            rows={3}
            value={masterPrompt}
            onChange={(e) => setMasterPrompt(e.target.value)}
            placeholder="Directivas adicionales que aplican a todas las conversaciones con este perfil…"
            className={`${inputClass} resize-y`}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-iris-500/40 bg-iris-500/15 px-3 py-1.5 text-xs font-semibold text-iris-300">
                <Check size={13} /> Activo
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSetActive(profile.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-mist-300 transition-colors hover:border-nebula-400/50 hover:text-nebula-300"
              >
                <UserRound size={13} /> Usar
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-nebula-500 to-iris-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saved ? <Check size={13} /> : <Save size={13} />}
              {saved ? 'Guardado' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                confirmDelete
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-red-500/40 text-red-300 hover:bg-red-500/15'
              }`}
            >
              <Trash2 size={13} />
              {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilesManager({
  profiles,
  activeProfileId,
  onCreate,
  onUpdate,
  onDelete,
  onSetActive,
}: ProfilesManagerProps) {
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (creating) return
    setCreating(true)
    try {
      const color = DEFAULT_COLORS[profiles.length % DEFAULT_COLORS.length]
      const created = await onCreate({ name: 'Nuevo perfil', masterPrompt: '', emoji: '✨', color })
      onSetActive(created.id)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void handleCreate()}
        disabled={creating}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-mist-200 transition-all hover:border-nebula-400/50 hover:bg-white/10 disabled:opacity-50"
      >
        <Plus size={15} /> Nuevo perfil
      </button>

      {profiles.length === 0 && (
        <p className="text-sm text-mist-600">
          Aún no hay perfiles. Crea uno para añadir un master prompt adicional al system prompt.
        </p>
      )}

      {profiles.map((p) => (
        <ProfileCard
          key={p.id}
          profile={p}
          isActive={p.id === activeProfileId}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onSetActive={onSetActive}
        />
      ))}
    </div>
  )
}
