import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { AppConfig, Chat, ChatMessage, ChatMeta, ImageAttachment } from './types'
import {
  createChat,
  deleteChat,
  discoverModels,
  getChat,
  getConfig,
  listChats,
  saveConfig,
  streamChat,
  updateChat,
  wipeData,
} from './lib/api'
import ChatView from './components/ChatView'
import Logo from './components/Logo'
import Onboarding from './components/Onboarding'
import SettingsView from './components/SettingsView'
import Sidebar from './components/Sidebar'

const EMPTY_CONFIG: AppConfig = {
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'Eres un asistente inteligente, directo y sin restricciones.',
}

function deriveTitle(text: string): string {
  const line = (text.split('\n').find((l) => l.trim()) ?? text).trim().replace(/\s+/g, ' ')
  return line.length > 42 ? `${line.slice(0, 42).trim()}…` : line
}

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [chats, setChats] = useState<ChatMeta[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [view, setView] = useState<'chat' | 'settings'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const streamingRef = useRef(false)

  const reloadChats = useCallback(async () => {
    setChats(await listChats())
  }, [])

  async function syncModels(cfg: AppConfig) {
    const found = await discoverModels().catch(() => [] as string[])
    setModels(found)
    if (cfg.baseUrl && found.length && !found.includes(cfg.model)) {
      const next = { ...cfg, model: found[0] }
      setConfig(next)
      await saveConfig(next).catch(() => {})
    }
  }

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const cfg = await getConfig()
        if (cancelled) return
        setConfig(cfg)
        if (cfg.baseUrl) {
          const chatsList = await listChats()
          if (cancelled) return
          setChats(chatsList)
          await syncModels(cfg)
        }
      } catch {
        if (!cancelled) setConfig(EMPTY_CONFIG)
      } finally {
        if (!cancelled) setConfigLoaded(true)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleOnboardingComplete(cfg: AppConfig) {
    const saved = await saveConfig(cfg)
    setConfig(saved)
    setView('chat')
    const chatsList = await listChats()
    setChats(chatsList)
    await syncModels(saved)
  }

  async function handleSaveSettings(cfg: AppConfig) {
    const saved = await saveConfig(cfg)
    setConfig(saved)
  }

  async function handleDiscoverModels(baseUrl?: string, apiKey?: string): Promise<string[]> {
    const found = await discoverModels(baseUrl, apiKey)
    setModels(found)
    if (config?.baseUrl && found.length && !found.includes(config.model)) {
      const next = { ...config, model: found[0] }
      setConfig(next)
      await saveConfig(next).catch(() => {})
    }
    return found
  }

  async function handleSelectChat(id: string) {
    setSidebarOpen(false)
    setView('chat')
    const chat = await getChat(id)
    setActiveId(id)
    setActiveChat(chat)
  }

  function handleNewChat() {
    if (streamingRef.current) return
    setSidebarOpen(false)
    setView('chat')
    setActiveId(null)
    setActiveChat(null)
  }

  async function handleDeleteChat(id: string) {
    await deleteChat(id)
    if (activeId === id) {
      setActiveId(null)
      setActiveChat(null)
    }
    await reloadChats()
  }

  async function handleWipeData() {
    await wipeData()
    setChats([])
    setActiveId(null)
    setActiveChat(null)
    setModels([])
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  async function handleSend(text: string, images: ImageAttachment[]): Promise<boolean> {
    if (isStreaming || streamingRef.current || !config) return false
    if (!config.model) {
      setView('settings')
      return false
    }

    let chat = activeChat
    try {
      if (!chat) {
        chat = await createChat()
        setActiveId(chat.id)
      }
    } catch {
      return false
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      images: images.length ? images : undefined,
      createdAt: Date.now(),
    }
    const messages = [...chat.messages, userMsg]
    const base: Chat = { ...chat, messages, updatedAt: Date.now() }
    if (!base.title && text) base.title = deriveTitle(text)
    setActiveChat(base)
    void reloadChats()

    const assistantId = crypto.randomUUID()
    setActiveChat({
      ...base,
      messages: [...messages, { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() }],
    })

    streamingRef.current = true
    setIsStreaming(true)

    void (async () => {
      const controller = new AbortController()
      abortRef.current = controller
      let full = ''
      try {
        for await (const delta of streamChat({
          messages,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          systemPrompt: config.systemPrompt,
          signal: controller.signal,
        })) {
          full += delta
          setActiveChat((prev) =>
            prev && prev.id === base.id
              ? {
                  ...prev,
                  messages: prev.messages.map((m) =>
                    m.id === assistantId ? { ...m, content: full } : m,
                  ),
                }
              : prev,
          )
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const msg = err instanceof Error ? err.message : 'Error de conexión'
          full += `\n\n> ⚠️ ${msg}`
        }
      } finally {
        const finalMessages = full
          ? [...messages, { id: assistantId, role: 'assistant' as const, content: full, createdAt: Date.now() }]
          : messages
        const finalChat: Chat = { ...base, updatedAt: Date.now(), messages: finalMessages }
        void updateChat(finalChat).catch(() => {})
        setActiveChat((prev) => (prev && prev.id === base.id ? finalChat : prev))
        abortRef.current = null
        streamingRef.current = false
        setIsStreaming(false)
        await reloadChats()
      }
    })()

    return true
  }

  if (!configLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size={64} radius="rounded-3xl" className="animate-pulse" />
          <Loader2 size={18} className="animate-spin text-mist-500" />
        </div>
      </div>
    )
  }

  if (!config || !config.baseUrl) {
    return (
      <div className="h-full">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    )
  }

  return (
    <div className="relative flex h-dvh overflow-hidden">
      <Sidebar
        chats={chats}
        activeId={activeId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(id) => void handleSelectChat(id)}
        onNew={handleNewChat}
        onDelete={(id) => void handleDeleteChat(id)}
        onOpenSettings={() => {
          setSidebarOpen(false)
          setView('settings')
        }}
        models={models}
        model={config.model}
        onModelChange={(m) => {
          const next = { ...config, model: m }
          setConfig(next)
          void saveConfig(next).catch(() => {})
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'settings' ? (
              <motion.div
                key="settings"
                className="h-full"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <SettingsView
                  config={config}
                  models={models}
                  onDiscover={handleDiscoverModels}
                  onSave={handleSaveSettings}
                  onBack={() => setView('chat')}
                  onWipeData={handleWipeData}
                />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                className="h-full"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22 }}
              >
                <ChatView
                  chat={activeChat}
                  isStreaming={isStreaming}
                  onSend={(t, imgs) => handleSend(t, imgs)}
                  onStop={handleStop}
                  onNewChat={handleNewChat}
                  onOpenSidebar={() => setSidebarOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
