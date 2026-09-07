import type { ChatMessage } from '../../types'
import Logo from '../Logo'
import Markdown from '../Markdown'
import ReasoningPanel from './ReasoningPanel'
import MessageActions from './MessageActions'

interface AssistantMessageProps {
  message: ChatMessage
  isStreaming: boolean
  isLast: boolean
  showActions: boolean
  onRegenerate?: () => void
  onExport: () => void
  onDeleteFromHere: () => void
}

/** Respuesta abierta, sin burbuja pesada (§12): glyph + markdown + fila de acciones. */
export default function AssistantMessage({
  message,
  isStreaming,
  isLast,
  showActions,
  onRegenerate,
  onExport,
  onDeleteFromHere,
}: AssistantMessageProps) {
  return (
    <div className="group flex gap-3">
      <div className="mt-1 shrink-0">
        <Logo size={28} radius="rounded-lg" />
      </div>
      <div className="relative min-w-0 flex-1 pt-0.5">
        <ReasoningPanel thinking={message.thinking} isStreaming={isStreaming && isLast} />
        <Markdown>{message.content}</Markdown>
        {isStreaming && isLast && (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block size-[9px] animate-caret rounded-[1px] bg-[var(--accent-2)] align-middle"
          />
        )}
        {showActions && (
          <MessageActions
            content={message.content}
            canRegenerate={isLast && !isStreaming}
            onRegenerate={onRegenerate}
            onExport={onExport}
            onDeleteFromHere={onDeleteFromHere}
          />
        )}
      </div>
    </div>
  )
}
