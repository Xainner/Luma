import { useState } from 'react'
import { Check, Copy, EllipsisVertical, Pencil, Plus, Shield, Trash2 } from 'lucide-react'
import type { Profile } from '../../types'
import { useI18n } from '../../i18n'
import { inputClass, labelClass, Section } from './parts'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

const DEFAULT_COLORS = ['#8b5cf6', '#22d3ee', '#e879f9', '#34d399', '#f59e0b', '#f87171']

interface ProfileSettingsProps {
  profiles: Profile[]
  activeProfileId: string
  isAdmin: boolean
  onCreate: (profile: Partial<Profile>) => Promise<Profile>
  onUpdate: (profile: Profile) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDuplicate: (profile: Profile) => Promise<void>
  onSetActive: (id: string) => void
}

function emptyDraft(): Partial<Profile> {
  return { name: '', emoji: '✨', color: DEFAULT_COLORS[0], masterPrompt: '' }
}

/** Settings > Perfiles (§24): grid admin, lectura + badge para el resto. */
export default function ProfileSettings({
  profiles,
  activeProfileId,
  isAdmin,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate,
  onSetActive,
}: ProfileSettingsProps) {
  const { t } = useI18n()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [draft, setDraft] = useState<Partial<Profile>>(emptyDraft())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  function openNew() {
    setEditing(null)
    setDraft({ ...emptyDraft(), color: DEFAULT_COLORS[profiles.length % DEFAULT_COLORS.length] })
    setEditorOpen(true)
  }

  function openEdit(p: Profile) {
    setEditing(p)
    setDraft({ name: p.name, emoji: p.emoji, color: p.color, masterPrompt: p.masterPrompt })
    setEditorOpen(true)
  }

  async function handleSaveEditor() {
    if (saving) return
    setSaving(true)
    try {
      if (editing) {
        await onUpdate({
          ...editing,
          name: (draft.name ?? '').trim() || t('profiles.unnamed'),
          emoji: draft.emoji ?? '✨',
          color: draft.color ?? DEFAULT_COLORS[0],
          masterPrompt: draft.masterPrompt ?? '',
        })
      } else {
        const created = await onCreate({
          name: (draft.name ?? '').trim() || t('profiles.unnamed'),
          emoji: draft.emoji ?? '✨',
          color: draft.color ?? DEFAULT_COLORS[0],
          masterPrompt: draft.masterPrompt ?? '',
        })
        onSetActive(created.id)
      }
      setEditorOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Section title={t('settings.nav.profiles')} desc={t('settings.profiles.subtitle')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!isAdmin && (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-hover)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
              <Shield size={12} aria-hidden="true" />
              {t('settings.profiles.adminManaged')}
            </p>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-3.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Plus size={15} />
              {t('profiles.new')}
            </button>
          )}
        </div>

        {profiles.length === 0 ? (
          <p className="text-sm text-[var(--text-subtle)]">{t('settings.noProfiles')}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {profiles.map((p) => (
              <li
                key={p.id}
                className={`rounded-xl border p-3.5 ${
                  p.id === activeProfileId
                    ? 'border-[var(--accent)]/50 bg-[var(--accent)]/5'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ background: `${p.color}22`, border: `1px solid ${p.color}55` }}
                    aria-hidden="true"
                  >
                    {p.emoji || '✨'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text)]">
                      {p.name}
                      {p.id === activeProfileId && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-[11px] font-semibold text-[var(--accent-2)]">
                          <Check size={11} aria-hidden="true" />
                          {t('settings.active')}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-subtle)]">
                      {p.masterPrompt || t('settings.noMaster')}
                    </p>
                  </div>
                  {isAdmin ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`${p.name}: ${t('msg.more')}`}
                          className="rounded-lg p-2 text-[var(--text-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                        >
                          <EllipsisVertical size={15} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        {p.id !== activeProfileId && (
                          <DropdownMenuItem onSelect={() => onSetActive(p.id)}>
                            {t('settings.profiles.setActive')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => openEdit(p)}>
                          <Pencil />
                          {t('settings.profiles.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void onDuplicate(p)}>
                          <Copy />
                          {t('settings.profiles.duplicate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setDeleteTarget(p)}
                          className="text-[var(--danger)] [&_svg]:text-[var(--danger)] focus:bg-[var(--danger)]/10"
                        >
                          <Trash2 />
                          {t('profiles.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    p.id !== activeProfileId && (
                      <button
                        type="button"
                        onClick={() => onSetActive(p.id)}
                        className="min-h-11 shrink-0 rounded-lg border border-[var(--border)] px-2.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                      >
                        {t('profiles.use')}
                      </button>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('settings.profiles.edit') : t('profiles.new')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="pf-name" className={labelClass}>
                  {t('profiles.name')}
                </label>
                <input
                  id="pf-name"
                  value={draft.name ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="w-16">
                <label htmlFor="pf-emoji" className={labelClass}>
                  {t('profiles.emoji')}
                </label>
                <input
                  id="pf-emoji"
                  value={draft.emoji ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))}
                  className={`${inputClass} text-center`}
                />
              </div>
              <div>
                <label htmlFor="pf-color" className={labelClass}>
                  {t('profiles.color')}
                </label>
                <input
                  id="pf-color"
                  type="color"
                  value={draft.color ?? DEFAULT_COLORS[0]}
                  onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                  className="h-[42px] w-12 cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-1"
                />
              </div>
            </div>
            <div>
              <label htmlFor="pf-master" className={labelClass}>
                {t('profiles.master')}{' '}
                <span className="text-[var(--text-subtle)]">{t('profiles.masterHint')}</span>
              </label>
              <textarea
                id="pf-master"
                rows={6}
                value={draft.masterPrompt ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, masterPrompt: e.target.value }))}
                placeholder={t('profiles.masterPlaceholder')}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
            >
              {t('admin.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveEditor}
              disabled={saving}
              className="min-h-11 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              {t('profiles.save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.profiles.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && t('settings.profiles.deleteBody', { name: deleteTarget.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && void onDelete(deleteTarget.id)}
              className="bg-[var(--danger)] hover:brightness-110"
            >
              {t('settings.data.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
