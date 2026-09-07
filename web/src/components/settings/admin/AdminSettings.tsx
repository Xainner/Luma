import { useState } from 'react'
import type { ConfigScope } from '../../../types'
import { useI18n } from '../../../i18n'
import UsersAdmin from './UsersAdmin'
import { GlobalConfigAdmin, StatusAdmin, SystemPromptAdmin } from './panels'

type AdminTab = 'users' | 'global' | 'prompt' | 'status'

interface AdminSettingsProps {
  currentUserId: string
  scope: ConfigScope
  systemPrompt: string
  baseUrl: string
  modelsCount: number
  version: string
  upstreamOk: boolean | null
  onSetScope: (scope: ConfigScope) => Promise<void>
  onSaveSystemPrompt: (prompt: string) => Promise<void>
  onTestUpstream: () => Promise<void>
}

/** Settings > Administración (§28): subtabs Usuarios | Global | Prompt | Estado. Solo admin. */
export default function AdminSettings(props: AdminSettingsProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<AdminTab>('users')

  const tabs: Array<[AdminTab, string]> = [
    ['users', t('settings.admin.tabs.users')],
    ['global', t('settings.admin.tabs.global')],
    ['prompt', t('settings.admin.tabs.prompt')],
    ['status', t('settings.admin.tabs.status')],
  ]

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t('settings.nav.admin')}
        className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-1"
      >
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-11 flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-all ${
              tab === id
                ? 'bg-[var(--accent)] text-white shadow'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersAdmin currentUserId={props.currentUserId} />}
      {tab === 'global' && <GlobalConfigAdmin scope={props.scope} onSetScope={props.onSetScope} />}
      {tab === 'prompt' && (
        <SystemPromptAdmin systemPrompt={props.systemPrompt} onSave={props.onSaveSystemPrompt} />
      )}
      {tab === 'status' && (
        <StatusAdmin
          baseUrl={props.baseUrl}
          modelsCount={props.modelsCount}
          scope={props.scope}
          version={props.version}
          upstreamOk={props.upstreamOk}
          onTest={props.onTestUpstream}
        />
      )}
    </div>
  )
}
