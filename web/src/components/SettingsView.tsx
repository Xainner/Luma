import type { AppConfig, ConfigMeta, Language, Profile, ThoughtEffort, User } from '../types'
import type { ExportFormat } from './app-shell/ChatRowMenu'
import { useUIStore } from '../stores/ui'
import SettingsShell from './settings/SettingsShell'
import GeneralSettings from './settings/GeneralSettings'
import AppearanceSettings from './settings/AppearanceSettings'
import ConnectionSettings from './settings/ConnectionSettings'
import ModelSettings from './settings/ModelSettings'
import ReasoningSettings from './settings/ReasoningSettings'
import ProfileSettings from './settings/ProfileSettings'
import AttachmentSettings from './settings/AttachmentSettings'
import ShortcutSettings from './settings/ShortcutSettings'
import DataSettings from './settings/DataSettings'
import AboutSettings from './settings/AboutSettings'
import AdminSettings from './settings/admin/AdminSettings'

const APP_VERSION = '0.1.0'

interface SettingsViewProps {
  config: AppConfig
  apiKeySet: boolean
  models: string[]
  profiles: Profile[]
  user: User
  meta: ConfigMeta
  activeChatId: string | null
  activeChatTitle: string
  onDiscover: (baseUrl?: string, apiKey?: string) => Promise<string[]>
  onSaveConnection: (patch: {
    baseUrl: string
    apiKey: string
    clearApiKey: boolean
  }) => Promise<void>
  onSetDefaultModel: (model: string) => Promise<void>
  onSetDefaultThinking: (effort: ThoughtEffort) => Promise<void>
  onSetModelThinking: (model: string, effort: ThoughtEffort | null) => Promise<void>
  onBack: () => void
  onWipeData: () => Promise<void>
  onCreateProfile: (profile: Partial<Profile>) => Promise<Profile>
  onUpdateProfile: (profile: Profile) => Promise<void>
  onDeleteProfile: (id: string) => Promise<void>
  onDuplicateProfile: (profile: Profile) => Promise<void>
  onSetProfile: (id: string) => void
  onSetScope: (scope: ConfigMeta['scope']) => Promise<void>
  onSaveSystemPrompt: (prompt: string) => Promise<void>
  onLanguageChange: (lang: Language) => void
  onExportActiveChat: (format: ExportFormat) => void
  onDeleteActiveChat: () => void
  onLogout: () => void
}

/** Ajustes v2 (§18): shell por categorías. Sin barra global de Guardar (§43). */
export default function SettingsView(props: SettingsViewProps) {
  const { config, apiKeySet, models, profiles, user, meta } = props
  const section = useUIStore((s) => s.settingsSection)
  const readOnly = meta.scope === 'global' && !meta.isAdmin

  return (
    <SettingsShell user={user} isAdmin={meta.isAdmin} onBack={props.onBack}>
      {section === 'general' && (
        <GeneralSettings language={config.language} onLanguageChange={props.onLanguageChange} />
      )}
      {section === 'appearance' && <AppearanceSettings />}
      {section === 'connection' && (
        <ConnectionSettings
          config={config}
          apiKeySet={apiKeySet}
          readOnly={readOnly}
          onDiscover={props.onDiscover}
          onSave={props.onSaveConnection}
        />
      )}
      {section === 'models' && (
        <ModelSettings
          config={config}
          models={models}
          readOnly={readOnly}
          onDiscover={() => props.onDiscover()}
          onSetDefault={props.onSetDefaultModel}
          onSetThinking={props.onSetModelThinking}
        />
      )}
      {section === 'reasoning' && (
        <ReasoningSettings
          config={config}
          models={models}
          readOnly={readOnly}
          onSetDefault={props.onSetDefaultThinking}
          onSetModelThinking={props.onSetModelThinking}
        />
      )}
      {section === 'profiles' && (
        <ProfileSettings
          profiles={profiles}
          activeProfileId={config.profileId}
          isAdmin={meta.isAdmin}
          onCreate={props.onCreateProfile}
          onUpdate={props.onUpdateProfile}
          onDelete={props.onDeleteProfile}
          onDuplicate={props.onDuplicateProfile}
          onSetActive={props.onSetProfile}
        />
      )}
      {section === 'attachments' && <AttachmentSettings />}
      {section === 'shortcuts' && <ShortcutSettings />}
      {section === 'data' && (
        <DataSettings
          activeChatId={props.activeChatId}
          activeChatTitle={props.activeChatTitle}
          onExport={props.onExportActiveChat}
          onDeleteCurrent={props.onDeleteActiveChat}
          onWipe={props.onWipeData}
          onLogout={props.onLogout}
        />
      )}
      {section === 'admin' && meta.isAdmin && (
        <AdminSettings
          currentUserId={user.id}
          scope={meta.scope}
          systemPrompt={config.systemPrompt}
          baseUrl={config.baseUrl}
          modelsCount={models.length}
          version={APP_VERSION}
          upstreamOk={models.length > 0 ? true : null}
          onSetScope={props.onSetScope}
          onSaveSystemPrompt={props.onSaveSystemPrompt}
          onTestUpstream={() => props.onDiscover().then(() => {})}
        />
      )}
      {section === 'about' && <AboutSettings version={APP_VERSION} />}
    </SettingsShell>
  )
}
