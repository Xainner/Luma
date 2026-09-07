import { useState } from 'react'
import { Download, EllipsisVertical, FileJson, FileText, Pencil, Trash2 } from 'lucide-react'
import { useI18n } from '../../i18n'
import { inputClass, labelClass } from '../../lib/ui'
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
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export type ExportFormat = 'md' | 'json' | 'pdf'

interface ChatRowMenuProps {
  title: string
  onRename: (title: string) => void
  onExport: (format: ExportFormat) => void
  onDelete: () => void
}

/** Menú ••• por conversación: renombrar (Dialog), exportar (submenu), eliminar (AlertDialog). */
export default function ChatRowMenu({ title, onRename, onExport, onDelete }: ChatRowMenuProps) {
  const { t } = useI18n()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [draft, setDraft] = useState(title)

  function openRename() {
    setDraft(title)
    setRenameOpen(true)
  }

  function submitRename() {
    const next = draft.trim()
    if (next && next !== title) onRename(next)
    setRenameOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('chatmenu.open')}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-1.5 text-[var(--text-subtle)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text)] focus-visible:opacity-100"
          >
            <EllipsisVertical size={15} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={() => {
              openRename()
            }}
          >
            <Pencil />
            {t('chatmenu.rename')}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Download />
              {t('chatmenu.export')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => onExport('md')}>
                <FileText />
                {t('export.md')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExport('json')}>
                <FileJson />
                {t('export.json')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExport('pdf')}>
                <FileText />
                {t('export.pdf')}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-[var(--danger)] [&_svg]:text-[var(--danger)] focus:bg-[var(--danger)]/10"
          >
            <Trash2 />
            {t('chatmenu.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rename.title')}</DialogTitle>
          </DialogHeader>
          <div>
            <label htmlFor="rename-input" className={labelClass}>
              {t('rename.label')}
            </label>
            <input
              id="rename-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename()
              }}
              placeholder={t('rename.placeholder')}
              autoFocus
              maxLength={120}
              className={inputClass}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>
              {t('deleteChat.cancel')}
            </Button>
            <Button onClick={submitRename} disabled={!draft.trim()}>
              {t('chat.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteChat.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteChat.desc', { title })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteChat.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="border-transparent bg-[var(--danger)] text-white hover:bg-[var(--danger)] hover:brightness-110"
            >
              {t('deleteChat.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
