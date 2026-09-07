import { useState } from 'react'
import { Check, Copy, EllipsisVertical, FileDown, RefreshCw, Trash2 } from 'lucide-react'
import { useI18n } from '../../i18n'
import { copyText } from '../../lib/clipboard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'

interface MessageActionsProps {
  content: string
  canRegenerate: boolean
  onRegenerate?: () => void
  onExport: () => void
  onDeleteFromHere: () => void
}

/** Fila de acciones de respuesta: copiar, regenerar, ••• (§12). */
export default function MessageActions({
  content,
  canRegenerate,
  onRegenerate,
  onExport,
  onDeleteFromHere,
}: MessageActionsProps) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (await copyText(content)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  const btn =
    'rounded-lg p-1.5 text-[var(--text-subtle)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text)]'

  return (
    <div className="mt-1 flex gap-0.5 opacity-60 transition-opacity focus-within:opacity-100 hover:opacity-100">
      <button
        type="button"
        onClick={copy}
        aria-label={t('msg.copy')}
        title={t('msg.copy')}
        className={cn(btn, copied && 'text-[var(--accent-2)]')}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      {canRegenerate && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          aria-label={t('chat.regenerate')}
          title={t('chat.regenerate')}
          className={btn}
        >
          <RefreshCw size={14} />
        </button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={t('msg.more')} title={t('msg.more')} className={btn}>
            <EllipsisVertical size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onSelect={onExport}>
            <FileDown />
            {t('msg.exportResponse')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDeleteFromHere}
            className="text-[var(--danger)] [&_svg]:text-[var(--danger)] focus:bg-[var(--danger)]/10"
          >
            <Trash2 />
            {t('msg.deleteFromHere')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
