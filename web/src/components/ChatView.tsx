import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Virtualizer, type VirtualizerHandle } from 'virtua'
import type { Chat, ImageAttachment, Profile, ThoughtEffort, VideoAttachment } from '../types'
import { useI18n, type I18nKey } from '../i18n'
import Composer from './Composer'
import Logo from './Logo'
import MessageBubble from './MessageBubble'

interface ChatViewProps {
  chat: Chat | null
  isStreaming: boolean
  thinkingEffort: ThoughtEffort
  thinkingModel: string
  onThinkingChange: (effort: ThoughtEffort) => void
  models: string[]
  model: string
  onModelChange: (model: string) => void
  profiles: Profile[]
  profileId: string
  onProfileChange: (id: string) => void
  onSend: (text: string, images: ImageAttachment[], videos: VideoAttachment[]) => Promise<boolean>
  onStop: () => void
  onEditMessage: (id: string, newText: string) => void
  onDeleteMessage: (id: string) => void
  onRegenerate: () => void
}

const SUGGESTIONS: I18nKey[] = [
  'chat.suggestion1',
  'chat.suggestion2',
  'chat.suggestion3',
  'chat.suggestion4',
]

export default function ChatView({
  chat,
  isStreaming,
  thinkingEffort,
  thinkingModel,
  onThinkingChange,
  models,
  model,
  onModelChange,
  profiles,
  profileId,
  onProfileChange,
  onSend,
  onStop,
  onEditMessage,
  onDeleteMessage,
  onRegenerate,
}: ChatViewProps) {
  const { t } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtRef = useRef<VirtualizerHandle>(null)
  const [atBottom, setAtBottom] = useState(true)

  const messages = useMemo(() => chat?.messages ?? [], [chat])
  const lastId = messages.length > 0 ? messages[messages.length - 1].id : null

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
  }

  useEffect(() => {
    if (atBottom && messages.length > 0) {
      virtRef.current?.scrollToIndex(messages.length - 1, { align: 'end' })
    }
  }, [messages, isStreaming, atBottom])

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        {messages.length === 0 ? (
          <div className="mx-auto max-w-3xl px-4 py-6">
            <div className="flex flex-col items-center py-12 text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="relative mb-8"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -m-5 animate-ping rounded-3xl bg-iris-500/20 motion-safe:[animation-duration:2.4s]"
                />
                <Logo size={96} radius="rounded-3xl" className="relative" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
                  {t('chat.emptyTitle')}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
                  {t('chat.emptyDesc')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2"
              >
                {SUGGESTIONS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => void onSend(t(k), [], [])}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-left text-sm text-[var(--text-muted)] transition-all hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--text)] active:scale-[0.98]"
                  >
                    {t(k)}
                  </button>
                ))}
              </motion.div>
            </div>
          </div>
        ) : (
          <Virtualizer ref={virtRef} scrollRef={scrollRef} data={messages} bufferSize={800}>
            {(m, index) => (
              <div
                key={m.id}
                className={`mx-auto max-w-3xl px-4 ${index === 0 ? 'pt-6' : 'pt-3'} pb-3`}
              >
                <MessageBubble
                  message={m}
                  isLast={m.id === lastId}
                  isStreaming={isStreaming}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                  onRegenerate={onRegenerate}
                />
              </div>
            )}
          </Virtualizer>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--border)] px-4 pt-3 pb-4">
        <div className="mx-auto max-w-3xl">
          <Composer
            onSend={onSend}
            isStreaming={isStreaming}
            onStop={onStop}
            thinkingEffort={thinkingEffort}
            thinkingModel={thinkingModel}
            onThinkingChange={onThinkingChange}
            models={models}
            model={model}
            onModelChange={onModelChange}
            profiles={profiles}
            profileId={profileId}
            onProfileChange={onProfileChange}
          />
        </div>
      </div>
    </div>
  )
}
