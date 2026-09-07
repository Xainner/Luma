import type { ChatMessage } from '../types'
import AssistantMessage from './chat/AssistantMessage'
import UserMessage from './chat/UserMessage'

interface MessageBubbleProps {
  message: ChatMessage
  isLast: boolean
  isStreaming: boolean
  onEdit?: (id: string, newText: string) => void
  onDelete?: (id: string) => void
  onDeleteFromHere?: (id: string) => void
  onExportMessage?: (message: ChatMessage) => void
  onRegenerate?: () => void
}

/** Fila de mensaje: delega en UserMessage / AssistantMessage. */
export default function MessageBubble({
  message,
  isLast,
  isStreaming,
  onEdit,
  onDelete,
  onDeleteFromHere,
  onExportMessage,
  onRegenerate,
}: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <UserMessage
        message={message}
        onEdit={(id, text) => onEdit?.(id, text)}
        onDelete={(id) => onDelete?.(id)}
      />
    )
  }
  return (
    <AssistantMessage
      message={message}
      isStreaming={isStreaming}
      isLast={isLast}
      showActions={isLast && !isStreaming && !!message.content}
      onRegenerate={onRegenerate}
      onExport={() => onExportMessage?.(message)}
      onDeleteFromHere={() => onDeleteFromHere?.(message.id)}
    />
  )
}
