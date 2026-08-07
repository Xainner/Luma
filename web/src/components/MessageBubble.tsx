import { useState } from 'react'
import { Copy, Pencil, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import type { ChatMessage } from '../types'
import { useI18n } from '../i18n'
import { inputClass } from '../lib/ui'
import Markdown from './Markdown'

interface MessageBubbleProps {
  message: ChatMessage
  isLast: boolean
  isStreaming: boolean
  onEdit?: (id: string, newText: string) => void
  onDelete?: (id: string) => void
  onRegenerate?: () => void
}

export default function MessageBubble({
  message,
  isLast,
  isStreaming,
  onEdit,
  onDelete,
  onRegenerate,
}: MessageBubbleProps) {
  const { t } = useI18n()
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)

  function startEdit() {
    setDraft(message.content)
    setEditing(true)
  }

  function saveEdit() {
    onEdit?.(message.id, draft)
    setEditing(false)
  }

  if (isUser) {
    if (editing) {
      return (
        <div className="flex justify-end">
          <div className="w-full max-w-[85%] sm:max-w-[75%]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(6, Math.max(2, draft.split('\n').length))}
              aria-label={t('chat.edit')}
              className={`${inputClass} resize-y`}
              autoFocus
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100"
              >
                {t('chat.cancel')}
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={!draft.trim()}
                className="rounded-xl bg-gradient-to-r from-nebula-500 to-iris-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                {t('chat.save')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="group flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%]">
          {message.images && message.images.length > 0 && (
            <div className={`mb-1.5 grid gap-1.5 ${message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {message.images.map((img) => (
                <img
                  key={img.id}
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full rounded-2xl border border-white/10 object-cover shadow-lg"
                  style={{ maxHeight: 280 }}
                />
              ))}
            </div>
          )}
          <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-nebula-500/80 via-iris-500/80 to-flare-500/70 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)]">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={startEdit}
              aria-label={t('chat.edit')}
              className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-white/5 hover:text-mist-200"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(message.id)}
              aria-label={t('chat.delete')}
              className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-red-500/15 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex gap-3">
      <div className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nebula-500 to-iris-600 shadow-[0_0_16px_rgba(139,92,246,0.35)]">
        <Sparkles size={15} className="text-white" />
      </div>
      <div className="relative min-w-0 flex-1 pt-1">
        <Markdown>{message.content}</Markdown>
        {isStreaming && isLast && (
          <span aria-hidden="true" className="ml-0.5 inline-block size-[9px] animate-caret rounded-[1px] bg-nebula-400 align-middle" />
        )}
        <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {isLast && !isStreaming && message.content && (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(message.content)}
              aria-label={t('bubble.copy')}
              className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-white/5 hover:text-mist-200"
            >
              <Copy size={14} />
            </button>
          )}
          {isLast && !isStreaming && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              aria-label={t('chat.regenerate')}
              className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-white/5 hover:text-nebula-300"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete?.(message.id)}
            aria-label={t('chat.delete')}
            className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-red-500/15 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
