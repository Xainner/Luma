import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Loader2, Plus, Shield } from 'lucide-react'
import type { AdminUser, User } from '../../../types'
import { createUser, deleteUser, listUsers, updateUser } from '../../../lib/api'
import { useI18n } from '../../../i18n'
import { inputClass } from '../parts'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { EllipsisVertical, Trash2 } from 'lucide-react'

/** Admin > Usuarios (§28.1): tabla + crear en dialog + ••• por fila. */
export default function UsersAdmin({ currentUserId }: { currentUserId: string }) {
  const { t } = useI18n()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<User['role']>('user')
  const [creating, setCreating] = useState(false)
  const [resetFor, setResetFor] = useState<AdminUser | null>(null)
  const [resetPw, setResetPw] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await listUsers())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.loadingUsers'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    try {
      await createUser(newEmail.trim(), newPassword, newRole)
      setNewEmail('')
      setNewPassword('')
      setNewRole('user')
      setCreateOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.loadingUsers'))
    } finally {
      setCreating(false)
    }
  }

  async function mutate(fn: () => Promise<unknown>) {
    try {
      await fn()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.loadingUsers'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--text-muted)]">{t('settings.admin.usersDesc')}</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-3.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Plus size={15} />
              {t('admin.create')}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin.users')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="email"
                aria-label={t('admin.newEmail')}
                placeholder={t('admin.newEmail')}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="password"
                aria-label={t('admin.newPass')}
                placeholder={t('admin.newPass')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                minLength={4}
                required
              />
              <select
                aria-label={t('admin.newPass')}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as User['role'])}
                className={inputClass}
              >
                <option value="user">{t('admin.roleUser')}</option>
                <option value="admin">{t('admin.roleAdmin')}</option>
              </select>
              <DialogFooter>
                <button
                  type="submit"
                  disabled={creating || !newEmail || !newPassword}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-40"
                >
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {t('admin.create')}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <p className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-3.5 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-subtle)]">{t('admin.loadingUsers')}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-xs text-[var(--text-subtle)]">
                <th scope="col" className="px-3.5 py-2.5 font-semibold">
                  {t('settings.admin.colUser')}
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-semibold">
                  {t('settings.admin.colRole')}
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-semibold">
                  {t('settings.admin.colStatus')}
                </th>
                <th scope="col" className="px-3.5 py-2.5 text-right font-semibold">
                  {t('settings.admin.colActions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.map((u) => {
                const isSelf = u.id === currentUserId
                return (
                  <tr key={u.id}>
                    <td
                      className="max-w-[220px] truncate px-3.5 py-2.5 text-[var(--text)]"
                      title={u.email}
                    >
                      {u.email}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-[var(--text-subtle)]">
                          ({t('settings.admin.you')})
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--accent-2)]">
                          <Shield size={11} aria-hidden="true" />
                          {t('admin.roleAdmin')}
                        </span>
                      ) : (
                        <span className="rounded-md bg-[var(--bg-hover)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                          {t('admin.roleUser')}
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-[var(--success)]">
                      {t('settings.admin.active')}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`${u.email}: ${t('msg.more')}`}
                            className="rounded-lg p-2 text-[var(--text-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                          >
                            <EllipsisVertical size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onSelect={() =>
                              void mutate(() =>
                                updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' }),
                              )
                            }
                          >
                            <Shield />
                            {t('admin.changeRole', { email: u.email })}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setResetFor(u)
                              setResetPw('')
                            }}
                          >
                            <KeyRound />
                            {t('admin.resetPass', { email: u.email })}
                          </DropdownMenuItem>
                          {!isSelf && (
                            <DropdownMenuItem
                              onSelect={() => setDeleteTarget(u)}
                              className="text-[var(--danger)] [&_svg]:text-[var(--danger)] focus:bg-[var(--danger)]/10"
                            >
                              <Trash2 />
                              {t('admin.delete', { email: u.email })}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={resetFor !== null} onOpenChange={(open) => !open && setResetFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{resetFor && t('admin.resetPass', { email: resetFor.email })}</DialogTitle>
          </DialogHeader>
          <input
            type="password"
            aria-label={t('admin.newPassword')}
            placeholder={t('admin.newPassword')}
            value={resetPw}
            onChange={(e) => setResetPw(e.target.value)}
            className={inputClass}
            minLength={4}
            autoFocus
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() =>
                resetFor &&
                void mutate(() => updateUser(resetFor.id, { password: resetPw })).then(() =>
                  setResetFor(null),
                )
              }
              disabled={resetPw.length < 4}
              className="min-h-11 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-40"
            >
              {t('admin.ok')}
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
            <AlertDialogTitle>
              {deleteTarget && t('admin.delete', { email: deleteTarget.email })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('admin.confirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && void mutate(() => deleteUser(deleteTarget.id))}
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
