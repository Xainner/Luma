import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, FileJson, FileText, Menu, SquarePen } from 'lucide-react'
import type { Chat, ImageAttachment } from '../types'
import { useI18n, type I18nKey } from '../i18n'
import { exportChatJson, exportChatMarkdown, exportChatPdf } from '../lib/export'
import Composer from './Composer'
import Logo from './Logo'
import MessageBubble from './MessageBubble'

interface ChatViewProps {
  chat: Chat | null
  isStreaming: boolean
  onSend: (text: string, images: ImageAttachment[]) => Promise<boolean>
  onStop: () => void
  onNewChat: () => void
  onOpenSidebar: () => void
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
  onSend,
  onStop,
  onNewChat,
  onOpenSidebar,
  onEditMessage,
  onDeleteMessage,
  onRegenerate,
}: ChatViewProps) {
  const { t } = useI18n()
  const endRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)

  const messages = chat?.messages ?? []
  const lastId = messages.length > 0 ? messages[messages.length - 1].id : null

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
  }

  useEffect(() => {
    if (atBottom) endRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' })
  }, [messages, isStreaming, atBottom])

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/8 px-4">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label={t('chat.openMenu')}
          className="rounded-lg p-2 text-mist-500 transition-colors hover:bg-white/5 hover:text-mist-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-mist-100">
            {chat?.title || t('chat.title')}
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            disabled={!chat}
            aria-label={t('export.menu')}
            aria-expanded={exportOpen}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-mist-400 transition-colors hover:bg-white/10 hover:text-mist-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={14} />
            <span className="hidden sm:inline">{t('export.menu')}</span>
          </button>
          <AnimatePresence>
            {exportOpen && chat && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="absolute right-0 top-full z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 shadow-xl backdrop-blur-xl"
              >
                {(
                  [
                    { k: 'export.md', icon: FileText, run: () => exportChatMarkdown(chat) },
                    { k: 'export.json', icon: FileJson, run: () => exportChatJson(chat) },
                    { k: 'export.pdf', icon: FileText, run: () => exportChatPdf(chat) },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.k}
                    type="button"
                    onClick={() => {
                      opt.run()
                      setExportOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-mist-300 transition-colors hover:bg-white/5 hover:text-mist-100"
                  >
                    <opt.icon size={14} className="text-nebula-300" />
                    {t(opt.k)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          aria-label={t('chat.new')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-mist-400 transition-colors hover:bg-white/10 hover:text-mist-100"
        >
          <SquarePen size={14} />
          <span className="hidden sm:inline">{t('chat.new')}</span>
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
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
                <Logo size={72} radius="rounded-3xl" className="relative" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <h2 className="font-display text-3xl font-bold tracking-tight text-mist-100">
                  {t('chat.emptyTitle')}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-mist-500">
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
                    onClick={() => void onSend(t(k), [])}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-mist-400 transition-all hover:border-iris-500/40 hover:bg-iris-500/10 hover:text-mist-100 active:scale-[0.98]"
                  >
                    {t(k)}
                  </button>
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MessageBubble
                      message={m}
                      isLast={m.id === lastId}
                      isStreaming={isStreaming}
                      onEdit={onEditMessage}
                      onDelete={onDeleteMessage}
                      onRegenerate={onRegenerate}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/8 px-4 pt-3 pb-4">
        <div className="mx-auto max-w-3xl">
          <Composer onSend={onSend} isStreaming={isStreaming} onStop={onStop} />
        </div>
      </div>
    </div>
  )
}
