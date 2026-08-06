import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type {
  AppConfig,
  Chat,
  ChatMessage,
  ChatMeta,
  ConfigMeta,
  ImageAttachment,
  Profile,
  User,
} from './types'
import {
  createChat,
  createProfile,
  deleteChat,
  deleteProfile,
  discoverModels,
  getChat,
  getConfig,
  getToken,
  listChats,
  listProfiles,
  login,
  logout,
  me,
  saveConfig,
  saveSystemPrompt,
  setConfigScope,
  streamChat,
  updateChat,
  updateProfile,
  wipeData,
} from './lib/api'
import ChatView from './components/ChatView'
import Login from './components/Login'
import Logo from './components/Logo'
import Onboarding from './components/Onboarding'
import SettingsView from './components/SettingsView'
import Sidebar from './components/Sidebar'
import { I18nProvider, translate } from './i18n'
import { uuid } from './lib/uuid'

function deriveTitle(text: string): string {
  const line = (text.split('\n').find((l) => l.trim()) ?? text).trim().replace(/\s+/g, ' ')
  return line.length > 42 ? `${line.slice(0, 42).trim()}…` : line
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [configMeta, setConfigMeta] = useState<ConfigMeta>({ scope: 'global', isAdmin: false })
  const [booted, setBooted] = useState(false)
  const [chats, setChats] = useState<ChatMeta[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [view, setView] = useState<'chat' | 'settings'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
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
        if (!getToken()) return
        const u = await me()
        if (cancelled || !u) return
        setUser(u)
        const cfgResp = await getConfig()
        if (cancelled) return
        setConfig(cfgResp.config)
        setConfigMeta({ scope: cfgResp.scope, isAdmin: cfgResp.isAdmin })
        const [chatsList, profilesList] = await Promise.all([listChats(), listProfiles()])
        if (cancelled) return
        setChats(chatsList)
        setProfiles(profilesList)
        await syncModels(cfgResp.config)
      } catch {
        /* servidor no disponible */
      } finally {
        if (!cancelled) setBooted(true)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin(email: string, password: string) {
    const u = await login(email, password)
    setUser(u)
    const cfgResp = await getConfig()
    setConfig(cfgResp.config)
    setConfigMeta({ scope: cfgResp.scope, isAdmin: cfgResp.isAdmin })
    const [chatsList, profilesList] = await Promise.all([listChats(), listProfiles()])
    setChats(chatsList)
    setProfiles(profilesList)
    await syncModels(cfgResp.config)
    setView('chat')
    setActiveId(null)
    setActiveChat(null)
    setSidebarOpen(false)
  }

  async function handleLogout() {
    abortRef.current?.abort()
    streamingRef.current = false
    await logout()
    setUser(null)
    setConfig(null)
    setConfigMeta({ scope: 'global', isAdmin: false })
    setChats([])
    setProfiles([])
    setModels([])
    setActiveId(null)
    setActiveChat(null)
    setIsStreaming(false)
  }

  async function handleOnboardingComplete(cfg: AppConfig) {
    const resp = await saveConfig(cfg)
    setConfig(resp.config)
    setConfigMeta({ scope: resp.scope, isAdmin: resp.isAdmin })
    setView('chat')
    const [chatsList, profilesList] = await Promise.all([listChats(), listProfiles()])
    setChats(chatsList)
    setProfiles(profilesList)
    await syncModels(resp.config)
  }

  async function handleSaveSettings(cfg: AppConfig) {
    const resp = await saveConfig(cfg)
    setConfig(resp.config)
    setConfigMeta({ scope: resp.scope, isAdmin: resp.isAdmin })
  }

  async function handleSetScope(scope: ConfigMeta['scope']) {
    await setConfigScope(scope)
    const resp = await getConfig()
    setConfig(resp.config)
    setConfigMeta({ scope: resp.scope, isAdmin: resp.isAdmin })
  }

  async function handleSaveSystemPrompt(prompt: string) {
    await saveSystemPrompt(prompt)
    setConfig((c) => (c ? { ...c, systemPrompt: prompt } : c))
  }

  async function handleChangeLanguage(language: 'es' | 'en') {
    if (!config) return
    const next = { ...config, language }
    setConfig(next)
    await saveConfig(next).catch(() => {})
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

  async function handleCreateProfile(profile: Partial<Profile>): Promise<Profile> {
    const created = await createProfile(profile)
    setProfiles(await listProfiles())
    return created
  }

  async function handleUpdateProfile(profile: Profile): Promise<void> {
    await updateProfile(profile)
    setProfiles(await listProfiles())
  }

  async function handleDeleteProfile(id: string): Promise<void> {
    await deleteProfile(id)
    if (config?.profileId === id) {
      const next = { ...config, profileId: '' }
      setConfig(next)
      await saveConfig(next).catch(() => {})
    }
    setProfiles(await listProfiles())
  }

  async function handleSetProfile(id: string): Promise<void> {
    if (!config) return
    const next = { ...config, profileId: id }
    setConfig(next)
    await saveConfig(next).catch(() => {})
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
      id: uuid(),
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

    const assistantId = uuid()
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
          const msg =
            err instanceof Error ? err.message : translate(config.language, 'app.errorConnection')
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

  const lang = config?.language ?? 'es'
  const provider = (node: React.ReactNode) => <I18nProvider lang={lang}>{node}</I18nProvider>

  if (!booted) {
    return provider(
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size={104} radius="rounded-3xl" className="animate-pulse" />
          <Loader2 size={18} className="animate-spin text-mist-500" />
        </div>
      </div>,
    )
  }

  if (!user) {
    return provider(
      <div className="h-full">
        <Login onLogin={handleLogin} />
      </div>,
    )
  }

  if (!config) {
    return provider(
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size={104} radius="rounded-3xl" className="animate-pulse" />
          <Loader2 size={18} className="animate-spin text-mist-500" />
        </div>
      </div>,
    )
  }

  if (!config.baseUrl) {
    return provider(
      <div className="h-full">
        <Onboarding
          onComplete={handleOnboardingComplete}
          blocked={configMeta.scope === 'global' && !configMeta.isAdmin}
        />
      </div>,
    )
  }

  return provider(
    <div className="relative flex h-dvh overflow-hidden">
      <Sidebar
        chats={chats}
        activeId={activeId}
        open={sidebarOpen}
        user={user}
        onClose={() => setSidebarOpen(false)}
        onSelect={(id) => void handleSelectChat(id)}
        onNew={handleNewChat}
        onDelete={(id) => void handleDeleteChat(id)}
        onOpenSettings={() => {
          setSidebarOpen(false)
          setView('settings')
        }}
        onLogout={() => void handleLogout()}
        models={models}
        model={config.model}
        onModelChange={(m) => {
          const next = { ...config, model: m }
          setConfig(next)
          void saveConfig(next).catch(() => {})
        }}
        profiles={profiles}
        profileId={config.profileId}
        onProfileChange={(id) => void handleSetProfile(id)}
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
                  profiles={profiles}
                  user={user}
                  meta={configMeta}
                  onDiscover={handleDiscoverModels}
                  onSave={handleSaveSettings}
                  onBack={() => setView('chat')}
                  onWipeData={handleWipeData}
                  onCreateProfile={handleCreateProfile}
                  onUpdateProfile={handleUpdateProfile}
                  onDeleteProfile={handleDeleteProfile}
                  onSetProfile={(id) => void handleSetProfile(id)}
                  onSetScope={handleSetScope}
                  onSaveSystemPrompt={handleSaveSystemPrompt}
                  onLanguageChange={handleChangeLanguage}
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
    </div>,
  )
}
