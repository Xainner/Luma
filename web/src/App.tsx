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
  ThoughtEffort,
  User,
  VideoAttachment,
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
  streamEvents,
  updateChat,
  updateProfile,
  wipeData,
} from './lib/api'
import ChatView from './components/ChatView'
import CommandPalette from './components/CommandPalette'
import Login from './components/Login'
import Logo from './components/Logo'
import Onboarding from './components/Onboarding'
import SettingsView from './components/SettingsView'
import AppShell from './components/app-shell/AppShell'
import AppSidebar from './components/app-shell/AppSidebar'
import ChatHeader from './components/app-shell/ChatHeader'
import type { ExportFormat } from './components/app-shell/ChatRowMenu'
import { TooltipProvider } from './components/ui/tooltip'
import { I18nProvider, translate } from './i18n'
import {
  exportChatMarkdown,
  exportChatJson,
  exportChatPdf,
  exportMessageMarkdown,
} from './lib/export'
import { stripVideoEphemeral } from './lib/videos'
import { useUIStore } from './stores/ui'
import { Toaster, toast } from 'sonner'
import { uuid } from './lib/uuid'

function deriveTitle(text: string): string {
  const line = (text.split('\n').find((l) => l.trim()) ?? text).trim().replace(/\s+/g, ' ')
  return line.length > 42 ? `${line.slice(0, 42).trim()}…` : line
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [configMeta, setConfigMeta] = useState<ConfigMeta>({ scope: 'global', isAdmin: false })
  const [apiKeySet, setApiKeySet] = useState(false)
  const [booted, setBooted] = useState(false)
  const [chats, setChats] = useState<ChatMeta[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const view = useUIStore((s) => s.view)
  const goChat = useUIStore((s) => s.goChat)
  const goSettings = useUIStore((s) => s.goSettings)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
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
        setApiKeySet(cfgResp.apiKeySet)
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
  }, [])

  async function handleLogin(email: string, password: string) {
    const u = await login(email, password)
    setUser(u)
    const cfgResp = await getConfig()
    setConfig(cfgResp.config)
    setConfigMeta({ scope: cfgResp.scope, isAdmin: cfgResp.isAdmin })
    setApiKeySet(cfgResp.apiKeySet)
    const [chatsList, profilesList] = await Promise.all([listChats(), listProfiles()])
    setChats(chatsList)
    setProfiles(profilesList)
    await syncModels(cfgResp.config)
    setActiveId(null)
    setActiveChat(null)
    goChat()
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
    setApiKeySet(resp.apiKeySet)
    goChat()
    const [chatsList, profilesList] = await Promise.all([listChats(), listProfiles()])
    setChats(chatsList)
    setProfiles(profilesList)
    await syncModels(resp.config)
  }

  async function handleSaveSettings(cfg: AppConfig) {
    try {
      const resp = await saveConfig(cfg)
      setConfig(resp.config)
      setConfigMeta({ scope: resp.scope, isAdmin: resp.isAdmin })
      setApiKeySet(resp.apiKeySet)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate(lang, 'toast.saveFailed'))
      throw err
    }
  }

  /** Guardado explícito de conexión (sección propia, §21+§43). */
  async function handleSaveConnection(patch: {
    baseUrl: string
    apiKey: string
    clearApiKey: boolean
  }) {
    if (!config) return
    await handleSaveSettings({
      ...config,
      baseUrl: patch.baseUrl,
      apiKey: patch.apiKey,
      clearApiKey: patch.clearApiKey,
    } as AppConfig & { clearApiKey?: boolean })
    if (patch.baseUrl !== config.baseUrl || patch.apiKey || patch.clearApiKey) {
      void handleDiscoverModels(patch.baseUrl || undefined, patch.apiKey || undefined).catch(
        () => {},
      )
    }
  }

  /** Thinking por defecto (inmediato, §23+§43). */
  async function handleSetDefaultThinking(effort: ThoughtEffort) {
    if (!config) return
    const next = { ...config, thinkingEffort: effort }
    setConfig(next)
    await saveConfig(next).catch(() => {})
  }

  /** Override por modelo; effort null = volver al predeterminado (sin × ambigua). */
  async function handleSetModelThinking(model: string, effort: ThoughtEffort | null) {
    if (!config) return
    const modelThinking = { ...(config.modelThinking ?? {}) }
    if (effort === null) delete modelThinking[model]
    else modelThinking[model] = effort
    const next = { ...config, modelThinking }
    setConfig(next)
    await saveConfig(next).catch(() => {})
  }

  async function handleSetScope(scope: ConfigMeta['scope']) {
    await setConfigScope(scope)
    const resp = await getConfig()
    setConfig(resp.config)
    setConfigMeta({ scope: resp.scope, isAdmin: resp.isAdmin })
    setApiKeySet(resp.apiKeySet)
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

  async function handleDuplicateProfile(profile: Profile): Promise<void> {
    const copySuffix = translate(lang, 'settings.profiles.copySuffix')
    await handleCreateProfile({
      name: `${profile.name} ${copySuffix}`,
      masterPrompt: profile.masterPrompt,
      emoji: profile.emoji,
      color: profile.color,
    })
  }

  async function handleSetProfile(id: string): Promise<void> {
    if (!config) return
    const next = { ...config, profileId: id }
    setConfig(next)
    await saveConfig(next).catch(() => {})
  }

  /** Nivel de thinking para el modelo actual (override por modelo). */
  function currentEffort(): ThoughtEffort {
    if (!config) return 'medium'
    return config.modelThinking?.[config.model] ?? config.thinkingEffort ?? 'medium'
  }

  async function handleSetThinking(effort: ThoughtEffort): Promise<void> {
    if (!config) return
    const next: AppConfig = config.model
      ? { ...config, modelThinking: { ...config.modelThinking, [config.model]: effort } }
      : { ...config, thinkingEffort: effort }
    setConfig(next)
    await saveConfig(next).catch(() => {})
  }

  async function handleSelectChat(id: string) {
    goChat()
    const chat = await getChat(id)
    setActiveId(id)
    setActiveChat(chat)
  }

  function handleNewChat() {
    if (streamingRef.current) return
    goChat()
    setActiveId(null)
    setActiveChat(null)
  }

  async function handleDeleteChat(id: string) {
    try {
      await deleteChat(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate(lang, 'toast.deleteFailed'))
      return
    }
    if (activeId === id) {
      setActiveId(null)
      setActiveChat(null)
    }
    await reloadChats()
  }

  async function handleWipeData() {
    try {
      await wipeData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate(lang, 'toast.deleteFailed'))
      return
    }
    setChats([])
    setActiveId(null)
    setActiveChat(null)
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  function startGeneration(base: Chat, contextMessages: ChatMessage[], autoTitle = false) {
    if (!config) return
    const assistantId = uuid()
    setActiveChat({
      ...base,
      messages: [
        ...contextMessages,
        { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() },
      ],
    })
    streamingRef.current = true
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller
    let full = ''
    let thought = ''
    void (async () => {
      try {
        for await (const ev of streamEvents({
          messages: contextMessages,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          signal: controller.signal,
        })) {
          if (ev.kind === 'thinking') {
            thought += ev.text
            const snapshot = thought
            setActiveChat((prev) =>
              prev && prev.id === base.id
                ? {
                    ...prev,
                    messages: prev.messages.map((m) =>
                      m.id === assistantId ? { ...m, thinking: snapshot } : m,
                    ),
                  }
                : prev,
            )
          } else {
            full += ev.text
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
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const msg =
            err instanceof Error ? err.message : translate(config.language, 'app.errorConnection')
          full += `\n\n> ⚠️ ${msg}`
        }
      } finally {
        const finalMessages = full
          ? [
              ...contextMessages,
              {
                id: assistantId,
                role: 'assistant' as const,
                content: full,
                thinking: thought || undefined,
                createdAt: Date.now(),
              },
            ]
          : contextMessages
        const finalChat: Chat = { ...base, updatedAt: Date.now(), messages: finalMessages }
        void updateChat(finalChat).catch(() => {})
        setActiveChat((prev) => (prev && prev.id === base.id ? finalChat : prev))
        abortRef.current = null
        streamingRef.current = false
        setIsStreaming(false)
        void reloadChats()
        if (autoTitle && full && contextMessages.some((m) => m.role === 'user')) {
          void generateChatTitle(finalChat)
        }
      }
    })()
  }

  async function generateChatTitle(chat: Chat) {
    if (!config || streamingRef.current) return
    const firstUser = chat.messages.find((m) => m.role === 'user')
    if (!firstUser) return
    const controller = new AbortController()
    let title = ''
    try {
      for await (const delta of streamChat({
        messages: [
          {
            id: uuid(),
            role: 'user',
            content: `Genera un título muy corto (máx 6 palabras, solo el título, sin comillas ni puntos) para una conversación que empieza así: "${firstUser.content.slice(0, 200)}"`,
            createdAt: Date.now(),
          },
        ],
        model: config.model,
        temperature: 0.3,
        maxTokens: 32,
        signal: controller.signal,
      })) {
        title += delta
        if (title.length >= 48) controller.abort()
      }
    } catch {
      /* sin título automático */
    }
    title = title
      .trim()
      .replace(/^["'“¿?]*/, '')
      .replace(/["'”…]+$/, '')
      .split('\n')[0]
      .trim()
    if (!title) return
    const short = title.slice(0, 60)
    const next = { ...chat, title: short, updatedAt: Date.now() }
    void updateChat(next).catch(() => {})
    setActiveChat((prev) => (prev && prev.id === chat.id ? { ...prev, title: short } : prev))
    void reloadChats()
  }

  async function handleSend(
    text: string,
    images: ImageAttachment[],
    videos: VideoAttachment[],
  ): Promise<boolean> {
    if (isStreaming || streamingRef.current || !config) return false
    if (!config.model) {
      goSettings()
      return false
    }

    let chat = activeChat
    try {
      if (!chat) {
        chat = await createChat()
        setActiveId(chat.id)
      }
    } catch {
      toast.error(translate(config.language, 'toast.chatFailed'))
      return false
    }

    const isFirst = chat.messages.length === 0
    const userMsg: ChatMessage = stripVideoEphemeral({
      id: uuid(),
      role: 'user',
      content: text,
      images: images.length ? images : undefined,
      videos: videos.length ? videos : undefined,
      createdAt: Date.now(),
    })
    const messages = [...chat.messages, userMsg]
    const base: Chat = { ...chat, messages, updatedAt: Date.now() }
    if (!base.title && text) base.title = deriveTitle(text)
    setActiveChat(base)
    void reloadChats()
    startGeneration(base, messages, isFirst)
    return true
  }

  function handleRegenerate() {
    const chat = activeChat
    if (!chat || streamingRef.current || !config) return
    const last = chat.messages[chat.messages.length - 1]
    if (!last || last.role !== 'assistant') return
    const contextMessages = chat.messages.slice(0, -1)
    startGeneration({ ...chat, messages: contextMessages, updatedAt: Date.now() }, contextMessages)
  }

  function handleEditMessage(messageId: string, newText: string) {
    const chat = activeChat
    if (!chat || streamingRef.current || !config) return
    const idx = chat.messages.findIndex((m) => m.id === messageId)
    if (idx < 0 || chat.messages[idx].role !== 'user' || !newText.trim()) return
    const edited = chat.messages.map((m, i) => (i === idx ? { ...m, content: newText } : m))
    const truncated = edited.slice(0, idx + 1)
    const base: Chat = { ...chat, messages: truncated, updatedAt: Date.now() }
    if (!base.title && newText) base.title = deriveTitle(newText)
    setActiveChat(base)
    void reloadChats()
    startGeneration(base, truncated)
  }

  async function handleDeleteMessage(messageId: string) {
    const chat = activeChat
    if (!chat || streamingRef.current) return
    const messages = chat.messages.filter((m) => m.id !== messageId)
    const next: Chat = { ...chat, messages, updatedAt: Date.now() }
    if (messages.length === 0) next.title = ''
    setActiveChat(next)
    await updateChat(next).catch(() => {})
    void reloadChats()
  }

  /** Elimina un mensaje y todo lo posterior (menú ••• de respuesta). */
  async function handleDeleteFromHere(messageId: string) {
    const chat = activeChat
    if (!chat || streamingRef.current) return
    const idx = chat.messages.findIndex((m) => m.id === messageId)
    if (idx < 0) return
    const messages = chat.messages.slice(0, idx)
    // eslint-disable-next-line react-hooks/purity -- event handler, no render
    const next: Chat = { ...chat, messages, updatedAt: Date.now() }
    if (messages.length === 0) next.title = ''
    setActiveChat(next)
    try {
      await updateChat(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate(lang, 'toast.deleteFailed'))
      return
    }
    void reloadChats()
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey
      const ui = useUIStore.getState()
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        ui.togglePalette()
      } else if (mod && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        handleNewChat()
      } else if (mod && e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault()
        ui.toggleSidebarCollapsed()
      } else if (e.key === 'Escape') {
        // Prioridad §26: 1) cerrar overlay abierto; 2) detener generación.
        const overlayOpen =
          document.querySelector('[role="dialog"],[role="menu"],[role="listbox"]') !== null
        if (ui.paletteOpen) ui.setPaletteOpen(false)
        else if (!overlayOpen) handleStop()
      } else if (e.key === '/' && !ui.paletteOpen) {
        const target = e.target as HTMLElement | null
        const tag = target?.tagName
        if (
          tag !== 'INPUT' &&
          tag !== 'TEXTAREA' &&
          tag !== 'SELECT' &&
          !target?.isContentEditable
        ) {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('luma:focus-composer'))
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const lang = config?.language ?? 'es'
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const setCollapsed = useUIStore((s) => s.setSidebarCollapsed)
  const paletteOpen = useUIStore((s) => s.paletteOpen)
  const provider = (node: React.ReactNode) => (
    <I18nProvider lang={lang}>
      <TooltipProvider delayDuration={300}>
        {node}
        <Toaster theme="dark" position="bottom-center" toastOptions={{ duration: 3500 }} />
      </TooltipProvider>
    </I18nProvider>
  )

  async function handleModelChange(m: string) {
    if (!config) return
    const next = { ...config, model: m }
    setConfig(next)
    await saveConfig(next).catch(() => {})
  }

  async function handleRenameChat(id: string, title: string) {
    try {
      const chat = await getChat(id)
      const next = { ...chat, title, updatedAt: Date.now() }
      await updateChat(next)
      setActiveChat((prev) => (prev && prev.id === id ? { ...prev, title } : prev))
      await reloadChats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate(lang, 'toast.saveFailed'))
    }
  }

  /** Exporta una sola respuesta como Markdown (menú •••). */
  function handleExportMessage(message: ChatMessage) {
    exportMessageMarkdown(activeChat?.title ?? 'respuesta', message.content)
  }

  async function handleExportChat(id: string, format: ExportFormat) {
    try {
      const chat = await getChat(id)
      if (format === 'md') exportChatMarkdown(chat)
      else if (format === 'json') exportChatJson(chat)
      else {
        await exportChatPdf(chat).catch((err) => {
          toast.error(err instanceof Error ? err.message : translate(lang, 'export.failed'))
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translate(lang, 'export.failed'))
    }
  }

  if (!booted) {
    return provider(
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size={160} radius="rounded-3xl" className="animate-pulse" />
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
          <Logo size={160} radius="rounded-3xl" className="animate-pulse" />
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

  const closePalette = () => useUIStore.getState().setPaletteOpen(false)

  return provider(
    <AppShell
      sidebar={
        <AppSidebar
          chats={chats}
          activeId={activeId}
          user={user}
          theme={theme}
          lang={lang}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onSearch={() => useUIStore.getState().setPaletteOpen(true)}
          onSelectChat={(id) => void handleSelectChat(id)}
          onNewChat={handleNewChat}
          onRenameChat={(id, title) => void handleRenameChat(id, title)}
          onExportChat={(id, format) => void handleExportChat(id, format)}
          onDeleteChat={(id) => void handleDeleteChat(id)}
          onOpenSettings={() => goSettings()}
          onLogout={() => void handleLogout()}
          onThemeChange={setTheme}
          onLanguageChange={(l) => void handleChangeLanguage(l)}
        />
      }
      header={
        view === 'chat' ? (
          <ChatHeader
            title={activeChat?.title || null}
            onOpenMobileSidebar={() => setSidebarOpen(true)}
            onExpandSidebar={() => setCollapsed(false)}
            sidebarCollapsed={collapsed}
            onRename={(title) => {
              if (activeId) void handleRenameChat(activeId, title)
            }}
            onExport={(format) => {
              if (activeId) void handleExportChat(activeId, format)
            }}
            onDelete={() => {
              if (activeId) void handleDeleteChat(activeId)
            }}
          />
        ) : null
      }
    >
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
              apiKeySet={apiKeySet}
              models={models}
              profiles={profiles}
              user={user}
              meta={configMeta}
              activeChatId={activeId}
              activeChatTitle={activeChat?.title ?? ''}
              onDiscover={handleDiscoverModels}
              onSaveConnection={handleSaveConnection}
              onSetDefaultModel={(m) => handleModelChange(m)}
              onSetDefaultThinking={(e) => handleSetDefaultThinking(e)}
              onSetModelThinking={(m, e) => handleSetModelThinking(m, e)}
              onBack={() => goChat()}
              onWipeData={handleWipeData}
              onCreateProfile={handleCreateProfile}
              onUpdateProfile={handleUpdateProfile}
              onDeleteProfile={handleDeleteProfile}
              onDuplicateProfile={handleDuplicateProfile}
              onSetProfile={(id) => void handleSetProfile(id)}
              onSetScope={handleSetScope}
              onSaveSystemPrompt={handleSaveSystemPrompt}
              onLanguageChange={handleChangeLanguage}
              onExportActiveChat={(format) => {
                if (activeId) void handleExportChat(activeId, format)
              }}
              onDeleteActiveChat={() => {
                if (activeId) void handleDeleteChat(activeId)
              }}
              onLogout={() => void handleLogout()}
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
              thinkingEffort={currentEffort()}
              thinkingModel={config?.model ?? ''}
              onThinkingChange={(e) => void handleSetThinking(e)}
              models={models}
              model={config.model}
              onModelChange={(m) => void handleModelChange(m)}
              profiles={profiles}
              profileId={config.profileId}
              onProfileChange={(id) => void handleSetProfile(id)}
              onOpenSettings={() => goSettings()}
              onSend={(t, imgs, vids) => handleSend(t, imgs, vids)}
              onStop={handleStop}
              onEditMessage={handleEditMessage}
              onDeleteMessage={(id) => void handleDeleteMessage(id)}
              onDeleteFromHere={(id) => void handleDeleteFromHere(id)}
              onExportMessage={handleExportMessage}
              onRegenerate={handleRegenerate}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        chats={chats}
        activeId={activeId}
        models={models}
        currentModel={config.model}
        profiles={profiles}
        currentProfileId={config.profileId}
        thinkingEffort={currentEffort()}
        thinkingModel={config.model}
        theme={theme}
        lang={lang}
        onSelectChat={(id) => void handleSelectChat(id)}
        onNewChat={handleNewChat}
        onOpenSettings={() => goSettings()}
        onModelChange={(m) => void handleModelChange(m)}
        onProfileChange={(id) => void handleSetProfile(id)}
        onThinkingChange={(e) => void handleSetThinking(e)}
        onExportChat={(format) => {
          if (activeId) void handleExportChat(activeId, format)
        }}
        onThemeChange={setTheme}
        onLanguageChange={(l) => void handleChangeLanguage(l)}
        onLogout={() => void handleLogout()}
      />
    </AppShell>,
  )
}
