import { useState } from 'react'
import { Download, HardDrive, LogOut, Trash2 } from 'lucide-react'
import { useI18n } from '../../i18n'
import { Section } from './parts'
import type { ExportFormat } from '../app-shell/ChatRowMenu'
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

interface DataSettingsProps {
  activeChatId: string | null
  activeChatTitle: string
  onExport: (format: ExportFormat) => void
  onDeleteCurrent: () => void
  onWipe: () => void
  onLogout: () => void
}

/** Settings > Datos (§27): exportación + datos locales + danger zone. */
export default function DataSettings({
  activeChatId,
  activeChatTitle,
  onExport,
  onDeleteCurrent,
  onWipe,
  onLogout,
}: DataSettingsProps) {
  const { t } = useI18n()
  const [confirm, setConfirm] = useState<'delete' | 'wipe' | null>(null)

  const exportBtn =
    'inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="space-y-6">
      <Section title={t('settings.data.export')} desc={t('settings.data.exportDesc')}>
        {activeChatId ? (
          <div className="flex flex-wrap gap-2">
            {(['md', 'json', 'pdf'] as ExportFormat[]).map((f) => (
              <button key={f} type="button" onClick={() => onExport(f)} className={exportBtn}>
                <Download size={15} />
                {f === 'md' ? t('export.md') : f === 'json' ? t('export.json') : t('export.pdf')}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-subtle)]">{t('settings.data.noActiveChat')}</p>
        )}
      </Section>

      <Section title={t('settings.data.local')}>
        <p className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]">
          <HardDrive size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t('settings.data.localDesc')}
        </p>
      </Section>

      <section className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/[0.04] p-5">
        <h2 className="font-display text-lg font-bold text-[var(--danger)]">
          {t('settings.data.danger')}
        </h2>
        <div className="mb-4" />
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setConfirm('delete')}
            disabled={!activeChatId}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-[var(--danger)]/30 px-3.5 text-left text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--danger)]/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={15} className="shrink-0 text-[var(--danger)]" aria-hidden="true" />
            {t('settings.data.deleteCurrent')}
          </button>
          <button
            type="button"
            onClick={() => setConfirm('wipe')}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-[var(--danger)]/30 px-3.5 text-left text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--danger)]/10"
          >
            <Trash2 size={15} className="shrink-0 text-[var(--danger)]" aria-hidden="true" />
            {t('settings.data.wipe')}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-[var(--border)] px-3.5 text-left text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg-hover)]"
          >
            <LogOut size={15} className="shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
            {t('settings.data.logout')}
          </button>
        </div>
      </section>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === 'delete' ? t('settings.data.deleteCurrent') : t('settings.data.wipe')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'delete'
                ? t('settings.data.deleteCurrentBody', { title: activeChatTitle || '…' })
                : t('settings.data.wipeBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => (confirm === 'delete' ? onDeleteCurrent() : onWipe())}
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
