import { Copy, Sparkles } from 'lucide-react'
import type { ChatMessage } from '../types'
import Markdown from './Markdown'

interface MessageBubbleProps {
  message: ChatMessage
  isLast: boolean
  isStreaming: boolean
}

export default function MessageBubble({ message, isLast, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const showCaret = isStreaming && isLast && message.role === 'assistant'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%]">
          {message.images && message.images.length > 0 && (
            <div
              className={`mb-1.5 grid gap-1.5 ${
                message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
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
        {showCaret && <span aria-hidden="true" className="ml-0.5 inline-block size-[9px] animate-caret rounded-[1px] bg-nebula-400 align-middle" />}
        {isLast && !isStreaming && message.content && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(message.content)}
            aria-label="Copiar respuesta"
            className="mt-1 rounded-lg p-1.5 text-mist-600 opacity-0 transition-opacity hover:bg-white/5 hover:text-mist-200 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
